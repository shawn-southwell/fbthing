const rp = require('request-promise');
const { accessToken } = require('./cred.js');

const groupURL = `https://graph.facebook.com/me/groups?access_token=${accessToken}`;
const url = `https://graph.facebook.com/GROUPID/feed?limit=100&access_token=${accessToken}`;
const URLreg = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;  // eslint-disable-line


const generateURL = (id) => url.replace('GROUPID', id);
const promisifyReq = (x) => new Promise(resolve => resolve(rp(x)));

const getGroupIDs = async () => {
  const groupResponse = await rp(groupURL);

  return JSON.parse(groupResponse).data;
};

const getAllPosts = async () => {
  const groupIDs = await getGroupIDs(groupURL);
  const promiseOfPosts = groupIDs.map(({ id }) => promisifyReq(generateURL(id)));
  const posts = await Promise.all(promiseOfPosts)
    .then(postGroup =>
        postGroup.map(group => (
          JSON.parse(group).data.map(postBody => postBody.message)
        )));

  return [].concat(...posts);
};

const hasURL = (post) => post.includes('http');

const getSongs = async () => {
  const allPosts = await getAllPosts();
  const postsContainingURLs = allPosts
                                .filter(post => post && hasURL(post))
                                .map(postURL => postURL.match(URLreg));

  return [].concat(...postsContainingURLs);
};


getSongs()
  .then((songs) => songs.map((song, i) => console.log(i, song)));
