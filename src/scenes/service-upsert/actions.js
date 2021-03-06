import Parse from 'parse';
import fetch_helpers from '../../libs/fetch_helpers';
import history from '../../main/history';
import { trackServiceCreated } from 'libs/analytics';
import { serverBaseURL } from '../../libs/config';
import axios from 'libs/axios';

export const types = {
  SERVICE_CREATE_STARTED: 'SERVICE_CREATE_STARTED',
  SERVICE_CREATE_SUCCESS: 'SERVICE_CREATE_SUCCESS',
  SERVICE_CREATE_ERROR: 'SERVICE_CREATE_ERROR',

  SERVICE_FETCH_STARTED: 'EDIT/SERVICE_FETCH_STARTED',
  SERVICE_FETCH_SUCCESS: 'EDIT/SERVICE_FETCH_SUCCESS',
  SERVICE_FETCH_ERROR: 'EDIT/SERVICE_FETCH_ERROR',

  SERVICE_SAVE_STARTED: 'EDIT/SERVICE_SAVE_STARTED',
  SERVICE_SAVE_SUCCESS: 'EDIT/SERVICE_SAVE_SUCCESS',
  SERVICE_SAVE_ERROR: 'EDIT/SERVICE_SAVE_ERROR',

  TOGGLE_SUBMITTING_STATE: 'TOGGLE_SUBMITTING_STATE',
  SERVICE_FORM_TAGS_FETCHED: 'SERVICE_FORM_TAGS_FETCHED',
};

export const user_profile_fetched = userProfile => {
  return {
    type: 'service-upsert/USER_PROFILE_FETCHED',
    payload: userProfile,
  };
};

export const submittingStateChanged = bool => {
  return {
    type: 'TOGGLE_SUBMITTING_STATE',
    payload: bool,
  };
};

export const serviceFormTagsOptionsFetched = payload => {
  return {
    type: 'SERVICE_FORM_TAGS_FETCHED',
    payload: payload,
  };
};

export const registerService = (values, history) => async (dispatch, getState) => {
  const state = getState();
  // const localStorageUser = localStorage.getItem(`please-${env}-session`);
  // const jsonUser = JSON.parse(localStorageUser);
  // const jwtToken = jsonUser.accessToken;
  const { isSubmitting } = state.ServiceUpsert;

  if (isSubmitting) return;
  dispatch({ type: types.SERVICE_CREATE_STARTED });

  try {
    const { acceptETH } = values;
    // let parseFile;
    // if (mainPicture) {
    //   const filename = generateFilename(mainPicture.name);
    //   if (filename.length) {
    //     parseFile = await new Parse.File(filename, mainPicture).save();
    //   }
    // }

    const service = fetch_helpers.createService(values);
    const result = await axios({
      method: 'POST',
      url: `${serverBaseURL}/services`,
      data: service,
    });

    if (acceptETH) {
      //dispatch(deployContract(result, values, history));
    } else {
      dispatch({
        type: types.SERVICE_CREATE_SUCCESS,
        payload: result,
        meta: { analytics: trackServiceCreated(result) },
      });
      history.push(`/services/${result.data._id}`);
    }
  } catch (error) {
    if (error.errors) {
      dispatch({ type: types.SERVICE_CREATE_ERROR, payload: error.errors });
    }
  }
};

export const fetchService = serviceId => async (dispatch, getState) => {
  if (!serviceId) return;
  const state = getState();
  const { isSubmitting } = state.ServiceUpsert;
  if (isSubmitting) return;

  dispatch({ type: types.SERVICE_FETCH_STARTED });
  try {
    const result = await axios.get(`${serverBaseURL}/services/${serviceId}`);

    const service = fetch_helpers.buildServiceForView(result.data);
    dispatch({ type: types.SERVICE_FETCH_SUCCESS, payload: service });
  } catch (error) {
    dispatch({ type: types.SERVICE_FETCH_ERROR, payload: error });
  }
};

export const fetchServiceFormTagsOptions = () => {
  return async dispatch => {
    try {
      const tags = await axios.get('/tags');
      if (tags) {
        dispatch(serviceFormTagsOptionsFetched(tags.data));
      }
    } catch (error) {
      console.log(error);
    }
  };
};

export const saveServiceChanges = (serviceId, values, history) => async (dispatch, getState) => {
  if (!serviceId) return;
  const state = getState();
  const { isSubmitting } = state.ServiceUpsert;
  if (isSubmitting) return;

  dispatch({ type: types.SERVICE_SAVE_STARTED });

  try {
    const updatedService = fetch_helpers.normalizeServiceToPatch(values);
    const result = await axios({
      method: 'PATCH',
      url: `${serverBaseURL}/services/${serviceId}`,
      data: updatedService,
    });

    if (updatedService.acceptETH) {
      //dispatch(deployContract(result, updatedService, history));
    } else {
      dispatch({ type: types.SERVICE_SAVE_SUCCESS, payload: result.data });
      history.push(`/services/${result.data._id}`);
    }
  } catch (error) {
    if (error.errors) {
      dispatch({ type: types.SERVICE_SAVE_ERROR, payload: error.errors });
    }
  }
};

export const fetchUserProfile = () => async dispatch => {
  try {
    const user = await axios.get(`${serverBaseURL}/users/me`);

    dispatch(user_profile_fetched({ user_profile: user.data }));
  } catch (e) {
    history.push('/login');
  }
};

export const resetErrors = () => dispatch => {
  dispatch({
    type: types.SERVICE_CREATE_ERROR,
    payload: {},
  });
};

export const redeployContract = (values, serviceId, history) => async (dispatch, getState) => {
  try {
    // Redeploy from styled_scenes/Account/Trips/shared/Carts/Location Or Redeploy from service creation form
    dispatch(submittingStateChanged(true));
    let service = await fetch_helpers.build_query('Service').get(serviceId);
    //dispatch(deployContract(service, values, history));
  } catch (error) {
    console.log(error);
  }
};

/*
export const deployContract = (service, values, history) => async (dispatch, getState) => {
  try {
    // TODO: @vlad if possible change this to use web3 as we're already using Web3 in other parts of the app
    const [ethers, { getWeb3, getLedgerWeb3 }] = await Promise.all([
      import('ethers'),
      import('libs/web3-utils'),
    ]);
    const { pricePerSession, slots } = values;
    const user = getState().ServiceUpsert.userProfile;

    // retrieve most recent contract ID
    let ipfsContract = Parse.Object.extend('ipfsContract');
    let query = new Parse.Query(ipfsContract);
    query.descending('createdAt');
    let ipfsContractObject = await query.first();

    // automatically assign the contract version to service
    service.set('contractVersion', {
      __type: 'Pointer',
      className: 'ipfsContract',
      objectId: ipfsContractObject.id,
    });
    await service.save();

    // retrieve contract details from ipfsAPI end point (abi and bytecode)

    let lastContract = await Parse.Cloud.run('getLastContract');

    // start deploying contract to network

    var bytecode = lastContract.bytecode;
    var abi = JSON.stringify(lastContract.abi);
    var params = {};
    params.start = [0, 0, 0, 0, 0, 0, 0];
    params.end = [20, 20, 20, 20, 20, 20, 20];
    params.price = pricePerSession;
    params.ipfs = 'efjisajefojseoifjwdjfoisjdfgjspdgfjoisdjgiosdjiofjsdiofjsiodhfgoishhj';
    params.maxAvailableSpots = slots;

    var network = ethers.providers.networks.ropsten;
    let preferredWeb3;

    if (user.metamaskPublicAddress) {
      try {
        preferredWeb3 = await getWeb3();
      } catch (e) {
        preferredWeb3 = await getLedgerWeb3();
      }
    } else {
      preferredWeb3 = await getLedgerWeb3();
    }

    let wallet = new ethers.providers.Web3Provider(
      preferredWeb3.currentProvider,
      network,
    ).getSigner();

    let deployTransaction = ethers.Contract.getDeployTransaction(
      bytecode,
      abi,
      1,
      params.start,
      params.end,
      params.ipfs,
      params.price,
      params.maxAvailableSpots,
      [10, 15],
      [50, 70],
      ipfsContractObject.get('ratingsContractAddress'),
      ipfsContractObject.get('tokenRateAddress'),
      ipfsContractObject.get('delegateResolverAddress'),
      ipfsContractObject.get('bookingTimeUtilsAddress'),
      ipfsContractObject.get('eventHubAddress'),
    );

    // we will use this later, hence I'll keep these lines commented
    // var provider = new ethers.providers.InfuraProvider(network);
    // let estimate = await provider.estimateGas(deployTransaction);

    // send transaction
    let transaction = {
      gasPrice: 25000000000,
      gasLimit: 4512058,
      data: deployTransaction.data,
    };

    let transactionResponse = await wallet.sendTransaction(transaction);

    // update contract address

    let newContractAddress = ethers.utils.getContractAddress(transactionResponse);
    service.set('contractAddress', newContractAddress);
    service.set('hash', transactionResponse.hash);

    await service.save();

    dispatch({ type: types.SERVICE_CREATE_SUCCESS, payload: service });
    history.push(`/services/${service.id}`);
  } catch (e) {
    dispatch({
      type: types.SERVICE_CREATE_ERROR,
      payload: {
        message:
          'We could not deploy the smart contract. Please check if your ledger device or meta mask are connected properly. ' +
          e.toString(),
        serviceId: service.id,
      },
    });
  }
};
*/
