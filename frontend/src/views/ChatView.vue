<template>
    <div class="flex flex-col h-screen bg-gradient-to-b from-blue-500 to-indigo-700 text-white">
        <!-- Header -->
        <header class="py-4 text-center shadow-md">
            <h1 class="text-2xl font-extrabold tracking-wide">Simple Chat App</h1>
        </header>

        <!-- Chat Settings -->
        <div class="p-4 bg-white text-gray-800 rounded-b-lg shadow-md">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Username Input -->
                <div>
                    <label class="block font-semibold mb-1">Username</label>
                    <input v-model="username" type="text" placeholder="Enter your username"
                        class="w-full p-3 border rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <!-- Channel Input -->
                <div>
                    <label class="block font-semibold mb-1">Channel</label>
                    <input v-model="channel" type="text" placeholder="Enter chat channel"
                        class="w-full p-3 border rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
        </div>

        <!-- Chat Messages -->
        <div class="flex-grow p-4 overflow-y-auto bg-gray-100 rounded-t-lg shadow-inner">
            <div v-for="(msg, index) in messages" :key="index" class="mb-4">
                <!-- Message Container -->
                <div :class="[
                    'flex items-start gap-2 w-full',
                    msg.username === username ? 'justify-end' : 'justify-start'
                ]">

                    <div class="flex gap-2" v-if="msg.username === username">
                        <!-- Message Bubble -->
                        <div :class="[
                            'px-4 py-2 rounded-lg max-w-xs',
                            msg.username === username
                                ? 'bg-blue-500 text-white self-end'
                                : 'bg-gray-200 text-gray-800 self-start'
                        ]">
                            <p v-if="msg.username !== username" class="text-sm font-semibold text-blue-600">
                                {{ msg.username }}
                            </p>
                            <p>{{ msg.message }}</p>
                        </div>
                        <!-- Avatar -->
                        <div v-if="msg.username !== username || msg.username === username"
                            class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {{ msg.username[0]?.toUpperCase() }}
                        </div>
                    </div>
                    <div class="flex gap-2" v-else>
                        <!-- Avatar -->
                        <div v-if="msg.username !== username || msg.username === username"
                            class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            {{ msg.username[0]?.toUpperCase() }}
                        </div>
                        <div :class="[
                            'px-4 py-2 rounded-lg max-w-xs',
                            msg.username === username
                                ? 'bg-blue-500 text-white self-end'
                                : 'bg-gray-200 text-gray-800 self-start'
                        ]">
                            <p v-if="msg.username !== username" class="text-sm font-semibold text-blue-600">
                                {{ msg.username }}
                            </p>
                            <p>{{ msg.message }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Input -->
        <div class="p-4 bg-white text-gray-800 shadow-md">
            <div class="flex items-center">
                <input v-model="messageInput" type="text" placeholder="Type a message"
                    class="flex-grow p-3 border rounded-l-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @keydown.enter="sendMessage" />
                <button @click="sendMessage"
                    class="bg-blue-600 text-white px-4 py-3 rounded-r-md shadow hover:bg-blue-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="m3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12L2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>




<script>
import { io } from "socket.io-client";
import axios from "axios";

export default {
    data() {
        return {
            socket: null,
            channels: [], // Daftar channel
            currentChannel: null, // Channel aktif
            messages: [], // Daftar pesan
            messageInput: "", // Input pesan
            userId: null, // ID pengguna saat ini dari cookie
            user: [], // Data pengguna
        };
    },
    created() {
        this.adjustViewportHeight();
        window.addEventListener("resize", this.adjustViewportHeight);

        // Inisialisasi Socket.IO
        this.socket = io("http://192.168.1.40:3000");

        // Mendapatkan pesan sebelumnya
        this.socket.on("previous_messages", (messages) => {
            console.log("Fetched previous messages:", messages); // Debug log
            this.messages = messages.map((msg) => ({
                ...msg,
            }));
            console.log("Processed previous messages:", this.messages); // Debug log setelah proses
        });

        // Mendengarkan pesan baru
        this.socket.on("chat_message", (data) => {
            console.log("New message received:", data); // Debug log
            this.messages.push({
                ...data,
            });
            console.log("Messages after adding new message:", this.messages); // Debug log setelah penambahan pesan
        });
    },
    watch: {
        channel(newChannel, oldChannel) {
            if (this.socket) {
                this.socket.emit("leave_channel", oldChannel); // Tinggalkan channel lama
                this.socket.emit("join_channel", newChannel); // Gabung ke channel baru
                this.messages = []; // Bersihkan pesan lama
            }
        },
    },
    methods: {
        adjustViewportHeight() {
            const viewportHeight = window.innerHeight;
            document.documentElement.style.setProperty("--vh", `${viewportHeight * 0.01}px`);
        },
        async fetchUserData() {
            try {
                const response = await axios.get("http://192.168.1.40:3000/api/auth/get-cookie-data", {
                    withCredentials: true,
                });

                if (response.status !== 200) {
                    throw new Error("Failed to fetch token");
                }

                const userData = response.data;
                this.userId = userData.data.id; // Simpan ID dari cookie

                const userDataResponse = await axios.get(
                    `http://192.168.1.40:3000/api/auth/get-user/${userData.data.id}`,
                    {
                        withCredentials: true,
                    }
                );

                if (userDataResponse.status !== 200) {
                    throw new Error("Failed to fetch user data");
                }

                this.user = userDataResponse.data;
            } catch (error) {
                console.error("Error fetching user data:", error);
                this.userId = null; // Tetapkan null jika gagal
            }
        },
        async fetchUserChannels() {
            try {
                console.log("Fetching user channels..."); // Debug log
                const response = await axios.get("http://192.168.1.40:3000/api/chat/get-channel", {
                    withCredentials: true,
                });

                if (response.status === 200 && response.data.channels.length > 0) {
                    console.log("Fetched channels:", response.data.channels); // Debug log
                    this.channels = response.data.channels;
                    this.currentChannel = this.channels[0];
                    await this.joinChannel(this.currentChannel);
                } else {
                    console.warn("No channels found..");
                }
            } catch (error) {
                console.error("Error fetching user channels:", error);
            }
        },
        async joinChannel(channel) {
            try {
                console.log("Joining channel:", channel); // Debug log
                const response = await axios.post(
                    "http://192.168.1.40:3000/api/chat/access-channel",
                    { channelId: channel._id },
                    { withCredentials: true }
                );

                if (response.status !== 200) {
                    throw new Error("Failed to join channel");
                }

                console.log("Channel joined successfully:", response.data); // Debug log
                this.currentChannel = response.data.channel;
                this.messages = response.data.messages.map((msg) => ({
                    ...msg,
                }));
                console.log("Messages in current channel:", this.messages); // Debug log
                console.log("myid : ", this.userId)

                this.socket.emit("join_channel", channel.name);

            } catch (error) {
                console.error("Error joining channel:", error);
            }
        },
        sendMessage() {
            if (this.messageInput.trim()) {
                const messageData = {
                    channel: this.channel,
                    username: this.username || "Anonymous",
                    message: this.messageInput,
                };

                this.socket.emit("chat_message", messageData);

                this.messages.push({
                    ...messageData,
                });

                this.messageInput = "";
            }
        },
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.adjustViewportHeight);
        if (this.socket) {
            this.socket.emit("leave_channel", this.channel);
        }
    },
};

</script>