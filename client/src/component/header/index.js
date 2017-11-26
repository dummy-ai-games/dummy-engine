/**
 * Created by brucewar on 2017/11/26.
 */

import React, {Component} from 'react';
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

class Header extends Component{
  render(){
    return(
      <Navbar inverse fluid>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#">Dummy</a>
          </Navbar.Brand>
        </Navbar.Header>
        <Nav>
          <NavItem href="#">飞行棋</NavItem>
        </Nav>
        <Nav pullRight>
          <LinkContainer to="/login">
            <NavItem>登录</NavItem>
          </LinkContainer>
          <LinkContainer to="/register">
            <NavItem>注册</NavItem>
          </LinkContainer>
        </Nav>
      </Navbar>
    );
  }
}

export default Header;