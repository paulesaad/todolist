"use strict";

require("es5-shim")
require("babel/register")

import {Promise} from 'es6-promise' //just grabbing the promise object out  of several in es6-promise
import $ from 'jquery'
import Backbone from 'backbone' //exports object is backbone itself
import React, {Component} from 'react'
import {Task, Tasks} from './task' //import model and collection from task.js (no need to to put .js)
//can do: import * as task from './task'
//task as variable instead of using it as its own namespace --> task.tasks
var Parse = window.Parse
Parse.$ = $
Parse.initialize("5rrb6SLqrLFAYRd76bM4zZZ0Pjuw708HWQoHGWlw", "mofB2TyYDRFDQTmYtxrQUhuTy3ucjVv3XYY79abn")

var qs = (selector) => document.querySelector(selector)

var newList = new Tasks()
newList.query = new Parse.Query(Task)

class TaskView extends Component{
	constructor(props){
        super(props)
        this.rerender = () => {
        	console.log('trying to save')
            this.props.data.save()
            this.forceUpdate()
        }
    }
    
    componentDidMount(){
        this.props.data.on('change', this.rerender)
    }

    componentDidUnmount(){
        this.props.data.off('change', this.rerender)
    }

	_updateTitle(){
		var updatedTitle = React.findDOMNode(this.refs.title).innerText
		this.props.data.set('title', updatedTitle)
	}

	// _updateDate(){
	// 	var updatedDate = React.findDOMNode(this.refs.date)
	// 	this.props.data.set('date', updatedDate)
	// }

	_toggleStatus(){
		var model = this.props.data,
			status = model.get('status')
		if (status !== 'done'){
			model.set('status', 'done')
		} else {
			model.set('status', 'pending')
		}
	}

	render(){
		var model = this.props.data
		return(
			<li className={ model.get('status') }>
				<p contentEditable ref="title" onBlur={() => this._updateTitle()}>{model.get('title')}</p>
				<input type="checkBox" ref="status" 
					   checked={model.get('status') === 'done'}
					   onChange={() => this._toggleStatus()} />
				<label htmlFor="isEssential">Essential?</label>
				<input type="checkBox" ref="isEssential" name="isEssential" 
						checked={model.get('isEssential')} />
				<input type="date" />
			</li>
		)
	}
}

class TaskListView extends Component{
	constructor(props){
        super(props)
        this.rerender = () => this.forceUpdate()
    }

    componentDidMount(){
    	//when collection updates or on sync, rerender to the page
        this.props.data.on('update sync', this.rerender)
    }

    componentDidUnmount(){
        this.props.data.off('update sync', this.rerender)
    }

	_appendModel(e){
		e.preventDefault()
		console.log(this)
		console.log(this.refs.newTitle.value)
		var titleInput = this.refs.newTitle
		console.log(titleInput.value)
		console.log(titleInput)
		var model = new Task({title: titleInput.value})
		this.props.data.create(model) //replaces add(model) and save()
        titleInput.value = ''
	}

	render(){
		var taskList = this.props.data
		return(
			<div>
				<form>
					<button onClick={() => Parse.User.logOut()}>Logout</button>
				</form>
				<form onSubmit={(e) => this._appendModel(e)}>
					<div><input type="text" ref="newTitle" placeholder="Enter a new task" /></div>
					<button>+</button>
				</form>
				<ul>
					{taskList.map((model) => <TaskView data={model} />)}
				</ul>
			</div>
		)
	}
}

class LoginView extends Component{
	constructor(props){
		super(props)
		this.state = {
			error: 0
		}
	}

	_registerUser(e){
		e.preventDefault()
		var user = new Parse.User(),
			email = React.findDOMNode(this.refs.newEmail).value,
			username = React.findDOMNode(this.refs.newUsername).value,
			password = React.findDOMNode(this.refs.newPassword).value

		user.set ({
			email: email,
			username: username,
			password: password
		})

		var signup = user.signUp()
		signup.then(()=> {
			alert("You have successfully joined!")
			window.location.hash = '/taskBoard'
		})
		signup.fail(() => {
			alert('Sign Up failed')
		})
	}

	_signInUser(e){
		e.preventDefault()
		var username = React.findDOMNode(this.refs.username).value,
			password = React.findDOMNode(this.refs.password).value

		var login = Parse.User.logIn(username, password, {
			success: (login) => {
				window.location.hash = '/taskBoard'
			},
			error: (login) => {
				this.setState({error: this.state.error + 1})
			}
		})
	}

	render(){
		var errorMessage = this.state.error ? (<small>Password Invalid: try {this.state.error}</small>) : ''
		return (<div className="loginView">
			<header>
				<h1>Productivity with Paul</h1>
				<span>Check it off!</span>
			</header>
			<div className="logIn">
				<h3>Login</h3>
				<form>
					<label htmlFor="username">Enter username:</label>
					<div><input type="text" ref="username" name="username" /></div>
					<label htmlFor="password">Enter password:</label>
					<div><input type="password" ref="password" name="password" /></div>
					<button onClick={(e) => this._signInUser(e)}>Submit</button>
					{errorMessage}
				</form>
			</div>
			<div className="dividers"><span>|</span><span>|</span></div>
			<div className="signUp">
				<h3>Register User</h3>
				<form>
					<label htmlFor="newEmail">Enter email:</label>
					<div><input type="email" ref="newEmail" name="newEmail" /></div>
					<label htmlFor="newUsername">Enter username:</label>
					<div><input type="text" ref="newUsername" name="newUsername" /></div>
					<label htmlFor="newPassword">Enter password:</label>
					<div><input type="password" ref="newPassword" name="newPassword" /></div>
					<button onClick={(e) => this._registerUser(e)}>Let's get productive</button>
				</form>
			</div>
		</div>)
	}
}


//ROUTER-----------------------------------------------------------------------------------------------------

var ParseRouter = Parse.Router.extend({
	routes:{
		'taskBoard' : 'taskBoard',
		'*default' : 'login' 
	},

	login:() => {
        if(Parse.User.current()){
            window.location.hash = '/taskBoard'
            return
        }
        React.render(<LoginView />, qs('.container'))		
	},

	taskBoard: () => {
		if(!Parse.User.current()){
			window.location.hash = '/login'
			return
		}

		newList.fetch()
		React.render(<TaskListView data={newList} />, qs('.container'))
	},

	initialize: () => {
		Parse.history.start()
	}
})

var router = new ParseRouter()
