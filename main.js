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
const getMorePostsIfExists = async (response, data = []) => {
  if (JSON.parse(response).data.length === 0) {
    return;
  }

  if (JSON.parse(response).paging.next) {
    await rp(JSON.parse(response).paging.next)
      .then(r => {
        const parsedResponse = JSON.parse(r);

        data.push(parsedResponse.data);
        return getMorePostsIfExists(r, data);
      });
  }
  return data;
};

const getAllPosts = async () => {
  const groupIDs = await getGroupIDs(groupURL);
  const promiseOfPosts = groupIDs.map(({ id }) => promisifyReq(generateURL(id)));
  const initialPosts = await Promise.all(promiseOfPosts);

  const allPosts = initialPosts.map(async (group) => {
    const posts = await getMorePostsIfExists(group, JSON.parse(group).data);

    const flattenedPosts = [].concat(...posts);
    const messages = flattenedPosts.map(flatPost => flatPost.message);

    return messages;
  });

  return Promise.all(allPosts);
};

// const hasURL = (post) => post.includes('http');

const getSongs = async () => {
  const allPosts = await getAllPosts();

  allPosts.forEach(group => {
    console.log('>>>>>>>>>>>>>>>');
    console.log(group);
    console.log('>>>>>>>>>>>>>>>');
  });
  // const postsContainingURLs = [].concat(...allPosts)
  //                               .filter(post => post && hasURL(post))
  //                               .map(postURL => postURL.match(URLreg));
  //
  return [].concat(...allPosts);
};


getSongs();
  // .then((songs) => songs.map((song, i) => console.log(i, song)));

