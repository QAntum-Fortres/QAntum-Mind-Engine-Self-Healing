/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyan: {
                    400: '#00f3ff', // Helios Cyan
                    900: '#003f4d',
                },
                void: '#000000',
            },
            fontFamily: {
                mono: ['Courier New', 'monospace'],
            },
            animation: {
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
