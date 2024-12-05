<template>
    <div class="flex flex-row w-lvw">
        <!-- Sidebar -->
        <div class="hidden md:flex md:w-[20%] h-lvh overflow-y-auto bg-teal-200 shadow-black shadow-md">
            <div class="flex flex-col justify-start items-center h-full w-full px-4 py-6 space-y-4">
                <div v-for="(ch, index) in channels" :key="index" @click="joinChannel(ch)"
                    class="border border-gray-300 rounded-md p-4 w-full bg-white hover:[box-shadow:0.5rem_0.5rem_#000] transition-all ease-in-out hover:-translate-y-1 cursor-pointer">
                    <p class="font-semibold text-lg text-gray-700">{{ ch.name }}</p>
                </div>
            </div>
        </div>

        <!-- Chat Section -->
        <div class="w-full md:w-[80%] bg-gray-50 flex flex-col" :style="{ height: 'calc(var(--vh, 1vh) * 100)' }">
            <!-- Messages -->
            <div class="flex-1 overflow-y-auto px-4 py-4">
                <div class="flex flex-col space-y-4">
                    <div v-for="(msg, index) in messages" :key="index"
                        :class="{ 'justify-end': msg.user === this.userId, 'justify-start': msg.user != this.userId }"
                        class="flex">
                        <div class="flex flex-col"
                            :class="{ 'items-end': msg.user === this.userId, 'items-start': msg.user != this.userId }">
                            <span class="text-xs font-semibold md:text-sm text-gray-500"
                                :class="{ 'text-end': msg.user === this.userId, 'text-start': msg.user != this.userId }">
                                {{ msg.user === this.userId ? "You" : msg.username }}
                            </span>
                            <div :class="{ 'bg-green-100 text-gray-800': msg.user === this.userId, 'bg-blue-100 text-gray-800': msg.user != this.userId }"
                                class="p-3 rounded-xl shadow-md">
                                <p>{{ msg.message }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input Section -->
            <div class="fixed md:relative px-4 bottom-3 w-full flex items-center space-x-4">
                <input v-model="messageInput" @keyup.enter="sendMessage" type="text"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ketik pesan Anda di sini..." />
                <button @click="sendMessage"
                    class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Kirim
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
    async mounted() {
        await this.fetchUserData();
        this.fetchUserChannels();
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
                    channel: this.currentChannel.id,
                    user: this.userId, // Kirim userId
                    username: this.user.username,
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
    },
};
</script>
