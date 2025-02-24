import chalk from 'chalk'; // For colorful console output
import pkg from 'pg'; // For PostgreSQL connection
const { Client } = pkg;
import figlet from 'figlet'; // For ASCII art
import fs from 'fs'; // For file system operations
import path from 'path'; // For path operations

import util from 'util'; // For utility functions

import env from './env.js'; // Import the database configuration
import { exec } from 'child_process';

// Object Example from all_tasks table as of 2025-01-26
//  {
//     kind: 'tasks#task',
//     id: 'eTVFMlIzZGV1VEh2TnhkSA',
//     etag: '"MzQ4ODczNDk4"',
//     title: 'finish server',
//     updated: 2024-12-29T23:41:00.000Z,
//     selflink: 'https://www.googleapis.com/tasks/v1/lists/AAAAAA',
//     position: '00000000000000000052',
//     status: 'needsAction',
//     due: 2024-12-31T00:00:00.000Z,
//     completed: null,
//     deleted: false,
//     hidden: false,
//     webviewlink: 'https://tasks.google.com/task/aaaaa?sa=6',
//     n8n_updatetime: null,
//     notes: null,
//     links: '{}',
//     tasklist_title: 'My Tasks',
//     tasklist_id: 'MTE3NzAwMzYwNzc0NTY4NjQ1ODM6MDow',
//     parent: null
//   },


// Create a new PostgreSQL client
const client = new Client(env.dbConfig);

// Function to connect to the database
async function connectToDatabase() {
	const client = new Client(env.dbConfig);
	try {
		await client.connect();
		console.log(chalk.green('✅ Connected to PostgreSQL database'));
		return client;
	} catch (err) {
		console.error(chalk.red('❌ Error connecting to the database:'), err);
		throw err;
	}
}

// Function to fetch tasks from the database
async function fetchTasks(client) {
	const query = 'SELECT * FROM all_tasks WHERE tasklist_title = $1 ORDER BY due ASC';
	const values = ['My Tasks'];
	try {
		const res = await client.query(query, values);
		return res.rows;
	} catch (err) {
		console.error(chalk.red('❌ Error executing query:'), err);
		throw err;
	}
}

// Function to truncate and process rows
function processTasks(rows) {
	// return rows.map(row => ({
	// 	title: row.title?.substring(0, 200) || '',
	// 	due: row.due ? new Date(row.due).toISOString().split('T')[0] : null

	// }));

	// convert to for loop
	const processedRows = [];
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		row.title = row.title?.substring(0, 200) || '';
		row.due = row.due ? new Date(row.due).toISOString().split('T')[0] : null;
		processedRows.push(row);
	}

	return processedRows;
}

// Function to filter tasks into "due today" and "overdue"
function filterTasks(rows) {
	const todayDate = new Date(new Date().toISOString().split('T')[0]);
	const todayString = todayDate.toISOString().split('T')[0];

	// Filter tasks into different categories
	const dueToday = rows.filter(row => row.due === todayString && row.status !== 'completed');
	const overdue = rows.filter(row => new Date(row.due) < todayDate && row.status !== 'completed');
	const completed = rows.filter(row => row.status === "completed");
	// console.log(rows[0])

	return { dueToday, overdue, completed };
}

// Function to display a fun morning greeting
function generateGreeting() {
	const now = new Date();
	const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
	const dateString = now.toLocaleDateString(undefined, options);

	let printString = '';
	printString += (chalk.blueBright(figlet.textSync('Good Morning!')));
	printString += '\n';
	printString += (chalk.yellow(`🌞 Today is ${dateString}`));
	printString += '\n';
	return printString;

}

// Function to generateTasksDisplay in a fun format
function generateTasksDisplay(dueToday, overdue) {
	let printString = '';
	printString += chalk.green('\n========================\n');
	printString += (chalk.green.bold('🌟 Tasks Due Today:'));
	printString += "\n"
	if (dueToday.length > 0) {
		printString += (`Total: ${chalk.bold(dueToday.length)} 🗓️`);

		// console.table(dueToday);
		dueToday.forEach(task => {
			printString += `\n- ${task.title}`;
		});
	} else {
		printString += (chalk.gray('No tasks due today! 🎉 Enjoy your day!'));
	}
	printString += "\n"

	printString += (chalk.red('\n========================\n'));
	printString += (chalk.red.bold('⚠️ Overdue Tasks:'));
	printString += "\n"
	if (overdue.length > 0) {
		printString += (`Total: ${chalk.bold(overdue.length)} ⏳`);
		// console.table(overdue);
	} else {
		printString += (chalk.gray('No overdue tasks! You’re on top of things! 💪'));
	}
	return printString;
}

function generateMonthlyCalendar(tasks) {
	const today = new Date(); // Replace with dynamic `new Date()` if needed
	const year = today.getFullYear();
	const month = today.getMonth();

	// Get the first and last day of the current month
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	// Create an array of all days in the current month
	const daysInMonth = [];
	for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
		daysInMonth.push(new Date(d));
	}

	// Map tasks to their due dates
	const taskCounts = {};
	daysInMonth.forEach(day => {
		const dateStr = day.toISOString().split('T')[0];
		taskCounts[dateStr] = 0;
	});

	tasks.forEach(task => {
		if (taskCounts[task.due] !== undefined) {
			taskCounts[task.due]++;
		}
	});

	// Superscript mapping for numbers
	const superscriptMap = {
		'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
		'5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
	};

	function toSuperscript(num) {
		return String(num).split('').map(digit => superscriptMap[digit] || digit).join('');
	}

	function taskCountColor(num) {
		if (num === 0) return chalk.gray(num);
		if (num <= 2) return chalk.green(num);
		if (num <= 4) return chalk.blueBright(num);
		return chalk.magentaBright(num);
	}

	// Generate the calendar header (weekdays)
	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	let calendarOutput = '';
	// Add the calendar title
	calendarOutput += `${today.toLocaleString('default', { month: 'long' })} ${year}\n`;
	calendarOutput += '┌───────────────────────────────────────────┐\n';
	calendarOutput += '│ ' + weekdays.map(day => day.padStart(5)).join(' ') + ' │\n';
	calendarOutput += '├───────────────────────────────────────────┤\n';

	// Generate the calendar rows
	let currentWeek = Array(7).fill('     '); // Empty week row
	daysInMonth.forEach(day => {
		const dayOfWeek = day.getDay();
		const dateStr = day.toISOString().split('T')[0];
		const taskCount = taskCounts[dateStr];

		// Format date with superscripts
		currentWeek[dayOfWeek] = `${taskCountColor(taskCount)} ${toSuperscript(day.getDate())}`.padStart(15);

		// Highlight today
		if (dateStr === today.toISOString().split('T')[0]) {
			currentWeek[dayOfWeek] = chalk.bgBlueBright.black(currentWeek[dayOfWeek]);
		}

		// If it's Saturday (end of the week), add the row to the calendar
		if (dayOfWeek === 6) {
			calendarOutput += '│ ' + currentWeek.join(' ') + ' │\n';
			currentWeek.fill('     ');
		}
	});

	// Add the last week if it's not complete
	if (currentWeek.some(cell => cell.trim() !== '')) {
		calendarOutput += '│ ' + currentWeek.join(' ') + ' │\n';
	}

	calendarOutput += '└───────────────────────────────────────────┘';

	return calendarOutput;
}



// Check for running processes on Windows
async function checkForRunningProcesses() {
	let printString = '';

	try {
		const stdout = await new Promise((resolve, reject) => {
			exec('tasklist', (error, stdout) => {
				if (error) reject(error);
				else resolve(stdout);
			});
		});

		const processes = stdout.toLowerCase();
		const synctrayzor = processes.includes('synctrayzor.exe');
		const netbird = processes.includes('netbird.exe');

		printString += chalk.cyan('Process Status:\n');
		printString += `SyncTrayzor: ${synctrayzor ? chalk.green('✅ Running') : chalk.red('❌ Not Running')}\n`;
		printString += `NetBird: ${netbird ? chalk.green('✅ Running') : chalk.red('❌ Not Running')}\n`;

		// if (synctrayzor && netbird) {
		// 	printString += chalk.green('✅ All required processes are running\n');
		// } else {
		// 	printString += chalk.yellow('⚠️ Some required processes are missing\n');
		// }

		return printString;
	} catch (error) {
		return chalk.red('❌ Error checking processes: ' + error + '\n');
	}
}




// save text to files in generated_text_elements folder
function saveTextToFile(filename, text) {
	const dir = env.fileSavePath.path;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	const filePath = path.join(dir, filename);

	fs.writeFile(filePath, text, (err) => {
		if (err) {
			console.error(chalk.red(`❌ Error writing to file ${filename}:`), err);
		} else {
			// console.log(chalk.green(`✅ File ${filename} saved successfully!`));
		}
	});
}

// Main function to run the script
async function runMorningTasks() {
	let client;

	try {
		// Display greeting
		await printWithDelay(generateGreeting());

		// Check to ensure processes are running on windows:
		// - SyncTrayzor
		// - NetBird

		// Check for required processes on Windows
		await printWithDelay(await checkForRunningProcesses());

		// Connect to the database
		client = await connectToDatabase();

		// Fetch tasks from the database
		const rows = await fetchTasks(client);

		// Process and filter tasks
		const processedRows = processTasks(rows);
		const { dueToday, overdue, completed } = filterTasks(processedRows);

		// Display tasks in a fun format
		await printWithDelay(generateTasksDisplay(dueToday, overdue));

		await printWithDelay("\n");
		// Generate and display the monthly calendar
		const calendar_overdue = generateMonthlyCalendar(overdue);
		await printWithDelay("Calendar of " + chalk.redBright("Overdue") + " Tasks:");
		await printWithDelay(calendar_overdue);
		const calendar_completed = generateMonthlyCalendar(completed);
		await printWithDelay("Calendar of " + chalk.greenBright("Completed") + " Tasks:");
		await printWithDelay(calendar_completed);

		saveTextToFile("task-calendar_completed.md", util.stripVTControlCharacters(calendar_completed));

		// Add a motivational message
		await printWithDelay(chalk.cyan('\n========================'));
		await printWithDelay(chalk.cyan.bold('💡 Motivational Quote of the Day:'));
		await printWithDelay(
			chalk.cyan(
				`"The secret of getting ahead is getting started." – Mark Twain`
			)
		);
		await printWithDelay("\n");


	} catch (err) {
		console.error(chalk.red('❌ An error occurred:'), err);
	} finally {
		if (client) {
			await client.end();
			console.log(chalk.green('✅ Connection to PostgreSQL Database closed'));
		}
	}
}

// Print function that prints one character at a time with a delay and returns a promise
async function printWithDelay(text, delay = 15) {
	return new Promise((resolve) => {
		// If text is empty or undefined, resolve immediately
		if (!text) {
			resolve();
			return;
		}

		// Convert to string if it's not already
		const stringText = String(text);

		// Split the string while preserving ANSI escape codes
		const parts = stringText.split(/(\x1b\[[0-9;]*m[^\x1b]*)/g).filter(Boolean);

		let totalDelay = 0;

		parts.forEach(part => {
			if (part.startsWith('\x1b')) {
				// Print styled text immediately as one chunk
				setTimeout(() => {
					process.stdout.write(part);
				}, totalDelay);
				totalDelay += delay;
			} else {
				// Print regular text character by character
				for (let i = 0; i < part.length; i++) {
					setTimeout(() => {
						process.stdout.write(part[i]);
					}, totalDelay);
					totalDelay += delay;
				}
			}
		});

		// Add final newline and resolve the promise
		setTimeout(() => {
			console.log();
			resolve();
		}, totalDelay);
	});
}



// Run the main function
runMorningTasks();