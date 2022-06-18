import { v4 as uuidV4 } from 'uuid';
import { debounce } from 'throttle-debounce';
import '../styles/styles.scss';

const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.querySelector('.messages-list');
const messageControl = messagesContainer.querySelector('.message-control');
const messageInput = messageControl.querySelector('.message-text-input');
const messages_notifications = messagesContainer.querySelector('.messages-notifications');
const myPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
});
let user_typing = false;
const myVideo = document.createElement('video');
myVideo.muted = false;

const active_user_name = window.prompt('Please, write youre name: ') || `test-${Date.now()}`;

socket.emit('user-logged', { user_name: active_user_name });

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
}).then(stream => {
    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
        call.answer(stream);
    });
    socket.emit('ready');

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
        // setTimeout(connectToNewUser,1000,userId,stream);
    });
})
.catch(error => {
    console.error(error);
    const room_id = location.pathname.replace(/\//g, '');
    socket.emit('join-room:messages-chat', room_id);
});

myPeer.on('open', id => {
    const room_id = location.pathname.replace(/\//g, '');
    socket.emit('join-room:video-chat', room_id, id);
});

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
};

const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    })
};

messageControl.addEventListener('submit', event => {
    event.preventDefault();

    if (messageInput.value && messageInput.value.trim()) {
        const room_id = location.pathname.replace(/\//g, '');
        const date = new Date(Date.now());
        const messageData = {
            type: 'message',
            text: messageInput.value,
            id: uuidV4(),
            date,
            room_id,
            user_name: active_user_name
        };

        socket.emit('message-send', JSON.stringify(messageData));
        socket.emit('user-typing-end');
        messageInput.value = '';
    }
});

messageInput.addEventListener('keydown', (event) => {
    if (!user_typing && event.key !== 'Enter') {
        socket.emit('user-typing-start');
        user_typing = true;
    }
});

window.addEventListener('keyup', debounce(1000, () => {
    socket.emit('user-typing-end');
}));


socket.on('user-typing-start', user_name => {
    if (user_name !== active_user_name) {
        showUserTypingNotification(user_name);
    }
});

socket.on('user-typing-end', () => {
    hideUserTypingNotification();
    user_typing = false;
})

socket.on('message-received', data => {
    const msg_data = JSON.parse(data);
    createNewMessage(msg_data);

    scrollToBottomOfMessagesList();
});

socket.on('list-room-messages', (messages, user_name) => {
    if (user_name === active_user_name) {
        const msgs_parsed = JSON.parse(messages);

        msgs_parsed.forEach((message, index, messages) => {
            if (index) {
                const prev_msg_day = new Date(messages[index - 1].date).getDate();
                const next_msg_day = new Date(messages[index].date).getDate();

                if (prev_msg_day < next_msg_day) {
                    insertDate(messages[index].date);
                }
            }
            createNewMessage(message);
        });
        scrollToBottomOfMessagesList();
    }
});

const insertDate = date => {
    const formatted_date = new Date(date).toLocaleDateString('en-us', { month: 'long', day: 'numeric' });
    const date_element = document.createElement('div');

    date_element.innerHTML = `<div class="brief-date">${formatted_date}</div>`;
    date_element.classList.add('brief-date-container');
    messagesList.append(date_element);
};

const createNewMessage = (message_data) => {
    const { text, date, user_name } = message_data;
    const parsed_date = new Date(date).toString().split('GMT')[0].trim();
    const message_element = document.createElement('div');

    message_element.innerHTML = `<b>${user_name}: </b><span class="message-content">${text}</span>
    <br><small class="text-muted">at: ${parsed_date}</small>`;
    message_element.classList.add('message-item');

    if (active_user_name === user_name) {
        message_element.classList.add('my-message');
    }

    messagesList.append(message_element);
};

const scrollToBottomOfMessagesList = () => {
    const {scrollHeight } = messagesList;
    messagesList.scrollTop = scrollHeight;
}

const showUserTypingNotification = user_name => {
    messages_notifications.innerHTML = `<div class="typing"><b>${user_name}</b> is typing...</div>`;
};

const hideUserTypingNotification = () => {
    const user_typing_element = messages_notifications.querySelector('.typing');

    if (user_typing_element) {
        user_typing_element.remove();
    }
};