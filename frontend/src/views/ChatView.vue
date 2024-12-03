<template>
    <div class="flex flex-row w-lvw">
        <div class="hidden md:flex md:w-[30%] h-lvh overflow-y-auto bg-slate-300 shadow-md"></div>
        <div class="w-full md:w-[70%] bg-blue-100 flex flex-col" :style="{ height: 'calc(var(--vh, 1vh) * 100)' }">
            <div class="flex-1 overflow-y-auto px-4 py-2">
                <div class="flex flex-col space-y-4">
                    <div class="flex justify-end">
                        <div class="flex flex-col">
                            <span class="text-xs font-semibold md:text-lg text-end">You</span>
                            <div
                                class="flex flex-col space-y-1 bg-green-400 p-2 md:p-4 rounded-xl text-black md:text-xl">
                                <p>Apakabar?</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-start">
                        <div class="flex flex-col">
                            <span class="text-xs font-semibold text-start md:text-lg">You</span>
                            <div
                                class="flex flex-col space-y-1 bg-slate-400 p-2 md:p-4 rounded-xl text-white md:text-xl">
                                <p>Apakabar?</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="fixed md:relative px-4 bottom-3 w-full flex items-center space-x-4">
                <input v-model="messageInput" @keyup.enter="sendMessage" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message" />
                <button @click="sendMessage"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Send
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
    data() {
        return {
            socket: null,
            channel: "general",
            messages: [],
            messageInput: "",
            username: "",
        };
    },
    created() {
        this.adjustViewportHeight();
        window.addEventListener("resize", this.adjustViewportHeight);

        this.socket = io("http://192.168.1.3:3000");
        this.socket.emit("join_channel", this.channel);

        this.socket.on("previous_messages", (messages) => {
            this.messages = messages;
        });

        this.socket.on("chat_message", (data) => {
            this.messages.push(data);
        });
    },
    methods: {
        adjustViewportHeight() {
            const viewportHeight = window.innerHeight;
            document.documentElement.style.setProperty("--vh", `${viewportHeight * 0.01}px`);
        },
        sendMessage() {
            if (this.messageInput.trim()) {
                const messageData = {
                    channel: this.channel,
                    username: this.username,
                    message: this.messageInput,
                };
                this.socket.emit("chat_message", messageData);
                this.messageInput = "";
            }
        },
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.adjustViewportHeight);
    },
};
</script>
