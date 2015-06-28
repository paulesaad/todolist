/*

task {
	title: 'string'
	duedate: data
	location: lat/lng
	task-status: (boolean isDone, isStarted, isCanceled) 
	string progress: [done, started, cancelled, upcoming])
	isUrgent: Boolean
	Notes: textbox
}

*/

export const Task = Parse.Object.extend({
	className:"Task",

	defaults: { 
		title: '(No Title)',
		duedate: null,
		notes: null,
		status: 'pending',
		isEssential: false
	}
})

export const Tasks = Parse.Collection.extend({
	model: Task
})


