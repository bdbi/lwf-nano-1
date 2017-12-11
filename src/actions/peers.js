import i18next from 'i18next';
import { oxy } from 'oxy-ts';
import actionTypes from '../constants/actions';
import { getNethash } from './../utils/api/nethash';
import { errorToastDisplayed } from './toaster';
import netHashes from '../constants/netHashes';

const peerSet = (data, config) => ({
  data: Object.assign({
    passphrase: data.passphrase,
    publicKey: data.publicKey,
    activePeer: oxy.api(config),
  }),
  type: actionTypes.activePeerSet,
});

/**
 * Returns required action object to set
 * the given peer data as active peer
 * This should be called once in login page
 *
 * @param {Object} data - Active peer data and the passphrase of account
 * @returns {Object} Action object
 */
export const activePeerSet = data =>
  (dispatch) => {
    const addHttp = (url) => {
      const reg = /^(?:f|ht)tps?:\/\//i;
      return reg.test(url) ? url : `http://${url}`;
    };
    const config = data.network || {};

    if (config.address) {
      const { hostname, port, protocol } = new URL(addHttp(config.address));

      config.node = hostname;
      config.ssl = protocol === 'https:';
      config.port = port || (config.ssl ? 10001 : 10000);
    }
    if (config.testnet === undefined && config.port !== undefined) {
      config.testnet = config.port === '9998';
    }
    if (config.custom) {
      oxy.newWrapper(`${config.address}`).blocks
        .getNethash()
        .then((resp) => {
          config.testnet = resp.nethash === netHashes.testnet;
          if (!config.testnet && resp.nethash !== netHashes.mainnet) {
            config.nethash = resp.nethash;
          }
          dispatch(peerSet(data, config));
        })
        .catch(() => {
          dispatch(errorToastDisplayed({ label: i18next.t('Unable to connect to the node') }));
        });
    } else {
      dispatch(peerSet(data, config));
    }
  };


/**
 * Returns required action object to partially
 * update the active peer
 *
 * @param {Object} data - Active peer data
 * @returns {Object} Action object
 */
export const activePeerUpdate = data => ({
  data,
  type: actionTypes.activePeerUpdate,
});
