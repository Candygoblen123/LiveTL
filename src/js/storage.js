import { get, writable } from 'svelte/store';
import { Browser, BROWSER } from './web-constants.js';
import { storageVersion } from './constants.js';

export const storage = new Storage(storageVersion);

/**
 * Store that synchronizes with extension storage.
 * 
 * @template T
 */
export class SyncStore {
  /**
   * @param {String} name 
   * @param {T} defaultValue 
   * @param {Storage} storageBackend 
   */
  constructor(name, defaultValue, storageBackend=null) {
    this.name = name;
    this.defaultValue = defaultValue;
    const store = writable(defaultValue);
    this._store = store;
    this._storage = storageBackend || storage;
    this._storage.get(name).then(value => {
      if (value != null) {
        store.set(value);
      }
    });
  }

  /**
   * @returns {T} the store value
   */
  get() {
    return get(this._store);
  }

  /**
   * @param {T} value 
   */
  set(value) {
    this._store.set(value);
    this._storage.set(this.name, value);
  }

  /**
   * @param {(n: T) => T} callback 
   */
  update(callback) {
    this._store.update(callback);
    this._storage.set(this.name, get(this._store));
  }

  reset() {
    this._store.set(this.defaultValue);
    this._storage.set(this.name, this.defaultValue);
  }

  /**
   * @param {(n: T) => void} callback 
   * @returns {() => void}
   */
  subscribe(callback) {
    return this._store.subscribe(callback);
  }
}

/**
 * Lookup store that synchronizes with extension storage.
 * 
 * @template T
 */
export class LookupStore {
  /**
   * @param {String} name 
   * @param {T} defaultValue 
   * @param {Storage} storageBackend 
   */
  constructor(name, defaultValue, storageBackend=null) {
    this.name = name;
    this.defaultValue = defaultValue;
    this._storage = storageBackend || storage;
  }

  /**
   * @param {String} key
   * @return {T}
   */
  get(key) { }

  /**
   * @param {String} key
   * @param {T} value
   */
  set(key, value) { }

  /**
   * @param {(n: T) => void} callback
   */
  update(callback) { }

  /**
   * @param {(key: String, value: T) => void} callback
   * @returns {() => void}
   */
  subscribe(callback) { }
}

async function getStorage(key, version='') {
  const versionKey = `${version || this.version}$$${key}`;
  const result = await this.rawGet(versionKey);
  return result ? result[versionKey] : result;
}

async function setStorage(key, value, version='') {
  const versionKey = `${version || this.version}$$${key}`;
  let obj = {};
  obj[versionKey] = value;
  return await this.rawSet(obj);
}

Storage.prototype.get = getStorage;
Storage.prototype.set = setStorage;

/**
 * @constructor
 * @param {String} version 
 */
export function Storage(version) {
  this.version = version;

  switch (BROWSER) {
  case Browser.ANDROID:
    this.rawGet = async key => {
      let data = {};
      try {
        data[key] = JSON.parse(localStorage[key]);
      } catch (e) {
        data[key] = localStorage[key];
      }
      return data;
    };

    this.rawSet = async obj => {
      let key = Object.keys(obj)[0];
      localStorage[key] = JSON.stringify(obj[key]);
    };
    break;
  case Browser.FIREFOX:
    this.rawGet = async (key) => {
    // eslint-disable-next-line no-undef
      return await browser.storage.local.get(key);
    };

    this.rawSet = async (obj) => {
    // eslint-disable-next-line no-undef
      return await browser.storage.local.set(obj);
    };
    break;
  default:
    this.rawGet = (key) => {
      return new Promise((res) => {
        // eslint-disable-next-line no-undef
        chrome.storage.local.get(key, res);
      });
    };

    this.rawSet = (obj) => {
      return new Promise((res) => {
      // eslint-disable-next-line no-undef
        chrome.storage.local.set(obj, res);
      });
    };
  }
}