import React, { Component } from 'react';
import DefaultLayout from "./component/layout/default";
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Login from './component/login/index';
import Register from './component/register/index';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <DefaultLayout exact path="/login" component={Login} />
          <DefaultLayout exact path="/register" component={Register} />
        </Switch>
      </Router>
    );
  }
}

export default App;
