

# This script dose not work 

# Start NetBird
# Start-Process "C:\Program Files\NetBird\NetBird.exe"

# Query Postgress Database for my tasks

# Define connection parameters
# $connectionString = "Host=localhost;Username=lucas;Password=lucas;Database=lucas"
$connectionString = "Host=192.168.10.120:5432;Username=;Password=;Database="
# Define the SQL query
$query = "SELECT * FROM tasks"
# use the query to get the tasks
# Connect to the database and execute the query
$tasks = Invoke-Sqlcmd -ConnectionString $connectionString -Query $query

# Print the tasks
$tasks
foreach ($task in $tasks) {
	Write-Output $task
}

