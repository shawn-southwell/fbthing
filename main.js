const rp = require('request-promise');
const { accessToken } = require('./cred.js');
const {
  compose,
  composeP,
  flatten,
  prop,
  reduce,
  match,
  map,
  tap // eslint-disable-line
} = require('ramda');

const groupURL = `https://graph.facebook.com/me/groups?access_token=${accessToken}`;
const url = `https://graph.facebook.com/GROUPID/feed?limit=100&access_token=${accessToken}`;
const URLreg = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;  // eslint-disable-line


const generateURL = id => url.replace('GROUPID', id);
const promisifyReq = x => new Promise(resolve => resolve(rp(x)));

const getGroupIDs = async () => {
  const groupResponse = await rp(groupURL);

  return JSON.parse(groupResponse).data;
};

const getMorePostsIfExists = async (response, data = []) => {
  if (JSON.parse(response).data.length === 0) {
    return data;
  }

  if (JSON.parse(response).paging.next) {
    const posts = await rp(JSON.parse(response).paging.next);
    const parsedResponse = JSON.parse(posts);

    data.push(parsedResponse.data);

    return getMorePostsIfExists(posts, data);
  }
  return data;
};

const getAllPosts = async () => {
  const promiseAll = ps => Promise.all(ps);
  const promisify = compose(promisifyReq, generateURL);

  const initialPostsByGroup = await composeP(
    promiseAll,
    map(({ id }) => promisify(id)),
    getGroupIDs
  )(groupURL);

  const allPosts = compose(
    promiseAll,
    map(group => {
      const formatMessages = compose(
        map(prop('message')),
        flatten);

      return composeP(
        formatMessages,
        getMorePostsIfExists
      )(group, JSON.parse(group).data);
    }))(initialPostsByGroup);


  return allPosts;
};

const getSongs = async () => {
  const allPosts = await getAllPosts();

  const filterURLS = (acc, x) => {
    const hasURL = match(x, URLreg);

    if (hasURL.length) {
      return acc.conat(hasURL);
    }

    return acc;
  };

  const postsContainingURLs = compose(
    reduce(filterURLS),
    tap(console.log),
    flatten
  )(allPosts);

  console.log(allPosts);

  return postsContainingURLs;
};


getSongs();
  // .then((songs) => songs.map((song, i) => console.log(i, song)));

