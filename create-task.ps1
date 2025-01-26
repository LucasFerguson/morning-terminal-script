# Variables
$taskName = "Lucas - Morning Terminal Script"
$batchFilePath = "C:\Users\Lucas\.Lucas\2025Code\morning-terminal-script\run.bat"
$taskDescription = "I created this task to run a bat file that runs a Node.js script called morning-script.js which queries a PostgreSQL database that holds my daily tasks and displays them in the terminal."

# Define the action to run the batch file
$action = New-ScheduledTaskAction -Execute $batchFilePath

# Define the trigger
$trigger = New-ScheduledTaskTrigger -AtStartup

# Define task settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register the task
Register-ScheduledTask -TaskName $taskName `
	-Action $action `
	-Trigger $trigger `
	-Settings $settings `
	-Description $taskDescription

# Verify if the task was created successfully
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($null -ne $task) {
	Write-Output "The scheduled task '$taskName' was created successfully."
	Write-Output "Details:"
	Write-Output $task
}
else {
	Write-Output "Failed to create the scheduled task. Please check your script and try again."
}
