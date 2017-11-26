/**
 * Created by brucewar on 2017/11/26.
 */
import React, {Component} from 'react';
import {Form, FormGroup, FormControl, Col, Button, ControlLabel} from 'react-bootstrap';

class Login extends Component {
  render(){
    return (
      <Form horizontal>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>用户名：</Col>
          <Col sm={10}>
            <FormControl type="text" placeholder="用户名"/>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col componentClass={ControlLabel} sm={2}>密码：</Col>
          <Col sm={10}>
            <FormControl type="text" placeholder="密码"/>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={2} sm={2}>
            <Button type="submit" bsStyle="primary">登录</Button>
          </Col>
        </FormGroup>
      </Form>
    );
  }
}

export default Login;