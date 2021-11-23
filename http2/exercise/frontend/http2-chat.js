const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const presence = document.getElementById("presence-indicator");

// this will hold all the most recent messages
let allChat = [];

chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  const data = {
    user,
    text,
  };

  // request options
  const options = {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  // send POST request
  // we're not sending any json back, but we could
  await fetch("/msgs", options);
}

async function getNewMsgs() {
  // more code to handle long-running connection, than complete connection (ex. used in `polling`)
  let reader;
  const utf8Decoder = new TextDecoder("utf-8");
  try {
    const res = await fetch("/msgs");
    reader = res.body.getReader(); // turns reader into a readable text stream (can't use res.json which waits for response to finish)
  } catch (e) {
    console.log("connection error: ", e);
  }
  presence.innerText = "🟢";

  let readerResponse;
  let done;
  do {
    try {
      readerResponse = await reader.read();
    } catch (e) {
      console.error("reader fail: ", e);
      presence.innerText = "🔴";
      return;
    }
    const chunk = utf8Decoder.decode(readerResponse.value, { stream: true });
    console.log("chunk: ", chunk);
    done = readerResponse.done;
    if (chunk) {
      try {
        const json = JSON.parse(chunk);
        allChat = json.msg;
        render();
      } catch (e) {
        console.error("JSON parse error: ", e);
      }
    }
  } while (!done);
  presence.innerText = "🔴"; // should do loop ever finish (not expected to)
}

function render() {
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

getNewMsgs();
