import React, { Component } from 'react';
import {
    Router,
    Route,
    Link,
    IndexRoute,
    hashHistory,
} from 'react-router';
import { TradeBuy } from './buysell'

import util from '../../lib/util'
import LayoutConfig from '../../config/layout.config';
import MenuNav from '../../components/menuNav/menuNav';

export default class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
        
    }
    componentDidMount() {
    }
    componentWillUnmount() {
    }
    menuOnClickHandler(index) {
    }
    render() {
        return (
            <div className="itrad-menuNav">
                <MenuNav data={LayoutConfig.page.list} onClick={this.menuOnClickHandler.bind(this)} />
                {this.props.children || <TradeBuy />}
            </div>
        );
    }

}






// var $navTop = LayoutConfig.page.list.map(function(v){
//   return(<MenuNav className="itrade-nav">{v.title}</MenuNav>)
// })
{/*{$navTop}*/ }