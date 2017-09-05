const rp = require('request-promise');
const { accessToken } = require('./cred.js');
const {
  compose,
  composeP, // eslint-disable-line
  flatten,
  prop,
  map
} = require('ramda');

const groupURL = `https://graph.facebook.com/me/groups?access_token=${accessToken}`;
const url = `https://graph.facebook.com/GROUPID/feed?limit=100&access_token=${accessToken}`;
const URLreg = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;  // eslint-disable-line


const generateURL = (id) => url.replace('GROUPID', id);
const promisifyReq = (x) => new Promise(resolve => resolve(rp(x)));

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
  const groupIDs = await getGroupIDs(groupURL);

  const promiseOfPosts = groupIDs.map(({ id }) => promisifyReq(generateURL(id)));

  const initialPosts = await Promise.all(promiseOfPosts);

  const allPosts = initialPosts.map(async (group) => {
    const posts = await getMorePostsIfExists(group, JSON.parse(group).data);

    const formatMessages = compose(
      map(prop('message')),
      flatten);

    return formatMessages(posts);
  });

  return Promise.all(allPosts);
};

const getSongs = async () => {
  const allPosts = await getAllPosts();

  console.log(allPosts);

  // const postsContainingURLs = flatten(allPosts)
  //                               .map(postURL => postURL.match(URLreg));
  //
  return flatten(allPosts);
};


getSongs();
  // .then((songs) => songs.map((song, i) => console.log(i, song)));

