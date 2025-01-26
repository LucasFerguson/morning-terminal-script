// PostgreSQL database connection configuration
// change title to env.js
// PostgreSQL database connection configuration
const dbConfig = {
	user: 'postgres',               // Your username
	host: '192.168.10.120',      // Database IP address
	database: 'googletasks',      // Database name
	password: '',          // Your password
	port: 5432,                  // Default PostgreSQL port
};

// export
const fileSavePath = {
	path: 'C:\\Users\\Lucas\\.Lucas\\2025Code\\morning-terminal-script\\generated_text_elements'
}

// export
export default {
	dbConfig,
	fileSavePath
}
