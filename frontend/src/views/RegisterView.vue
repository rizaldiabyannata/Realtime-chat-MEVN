<template>
    <div class="bg-gray-100 flex items-center justify-center h-screen">
        <div id="app" class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-bold mb-6 text-center">Register</h2>
            <form @submit.prevent="handleSubmit">
                <div class="mb-4">
                    <label for="username" class="block text-gray-700">Username</label>
                    <input type="text" id="username" v-model="username"
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required>
                </div>
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
                    class="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200">Register</button>
            </form>
            <p class="mt-4 text-center text-gray-600">Already have an account? <a href="/login"
                    class="text-blue-500 hover:underline">Login</a></p>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            username: '',
            email: '',
            password: '',
            loading: false,
            errorMessage: null,
            successMessage: null,
        };
    },
    methods: {
        async handleSubmit() {
            try {
                this.loading = true;
                this.errorMessage = null;
                this.successMessage = null;

                // Kirim data registrasi ke server
                const response = await axios.post("http://192.168.1.3:3000/api/auth/register", {
                    username: this.username,
                    email: this.email,
                    password: this.password,
                });

                // Jika registrasi berhasil
                this.successMessage = "Registrasi berhasil! Silakan login.";
                console.log(response.data);
                // Reset form
                this.username = '';
                this.email = '';
                this.password = '';

                this.$router.push("/login");
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
