<template>
    <div class="bg-gray-100 flex items-center justify-center h-screen">
        <div id="app" class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
            <form @submit.prevent="handleSubmit">
                <div class="mb-4">
                    <label for="email" class="block text-gray-700">Email</label>
                    <input type="email" id="email" v-model="email"
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required>
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-gray-700">Password</label>
                    <input type="password" id="password" v-model="password"
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required>
                </div>
                <button type="submit"
                    class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200">Login</button>
            </form>
            <p class="mt-4 text-center text-gray-600">Don't have an account? <a href="/register"
                    class="text-blue-500 hover:underline">Sign up</a></p>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            email: '',
            password: '',
            loading: false,
            errorMessage: null,
        };
    },
    methods: {
        async handleSubmit() {
            try {
                this.loading = true;
                this.errorMessage = null;

                // Mengirim data ke server
                const response = await axios.post("http://192.168.1.40:3000/api/auth/login", {
                    email: this.email,
                    password: this.password,
                }, {
                    withCredentials: true, // Untuk mengirim cookie (JWT, dll.)
                });

                // Jika login berhasil
                console.log(response.data);
                alert("Login berhasil! Selamat datang.");

                // Arahkan pengguna ke halaman lain
                this.$router.push("/chat");
            } catch (error) {
                console.error(error);
                if (error.response && error.response.data) {
                    this.errorMessage = error.response.data.error || "Terjadi kesalahan.";
                } else {
                    this.errorMessage = "Tidak dapat terhubung ke server.";
                }
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>
