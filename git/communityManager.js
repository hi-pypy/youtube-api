/**
 * Dummy communityManager file.
 * Simulates posting a message (with an optional poll) to a community.
 *
 * @param {string} message - The community post message.
 * @param {object|null} poll - An optional poll object containing a question and choices.
 */
function postToCommunity(message, poll = null) {
  console.log("Posting to community:");
  console.log("Message:", message);
  if (poll) {
    console.log("Poll:", poll);
  } else {
    console.log("No poll provided.");
  }
}

module.exports = {
  postToCommunity
};