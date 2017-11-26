/**
 * Created by brucewar on 2017/11/26.
 */

import React from 'react';
import Header from "../header/index";
import Footer from "../footer/index";
import {Grid, Row, Col} from 'react-bootstrap';
import {Route} from 'react-router-dom';

const DefaultLayout = ({component: Component, ...rest}) => {
  return (
    <Route {...rest} render={matchProps => (
      <div>
        <Header />
        <Grid fluid={true}>
          <Row>
            <Col sm={12}>
              <Component {...matchProps} />
            </Col>
          </Row>
        </Grid>
        <Footer/>
      </div>
    )} />
  );
};

export default DefaultLayout;