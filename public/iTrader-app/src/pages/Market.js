import React from 'react';
import {
    render,
    ReactDOM
} from 'react-dom';
import {
    Container,
    Input,
    Form,
    Button,
    List,
    ListItem,
} from 'amazeui-react';


const Market = React.createClass({
    marketHead() {
        const headList = [
            { "id": "HK0001", "name": "恒生指数", "20": "SEHK", "changeP": 120.461, "change": 0.44 },
            { "id": "SH00001", "name": "上证指数", "20": "SHSE", "changeP": 0.07, "change": 2.42 },
            { "id": "SZ00001", "name": "深圳成指", "20": "SZSE", "changeP": 45.01, "change": 0.43 },
        ];
        return (
            <div className="itrader-col4 itrader-flex">
                {
                    headList.map((item, index) => {
                        return (
                            <div key={index}>
                                <li>{item.name}</li>
                                <li>{item.id}</li>
                                <li>{item.change}</li>
                                <li>{item.changeP}</li>
                            </div>
                        );
                    })
                }
            </div>
        )
    },

    marketCont() {
        const contList = [
            { "code": "00001", "name": "CHEUNG KONGGGGGGGGGGGGGG", "exchange": "SEHK", "last": 152.06, "changeP": -0.15 },
            { "code": "00002", "name": "CLP HOLDINGS", "exchange": "SHSE", "last": 13.55, "changeP": 0.15 },
            { "code": "00003", "name": "HK & CHINA GAS", "exchange": "SZSE", "last": 155, "changeP": 0.15 },
            { "code": "00004", "name": "WHARF HOLDING SS SSS SSS SSSSSSSSS", "exchange": "US" },
            { "code": "00005", "name": "HSBC HOLDINGS", "exchange": "SEHK" },
            { "code": "00006", "name": "HK ELECTRIC", "exchange": "SHSE" },
            { "code": "00007", "name": "KARL THOMSON", "exchange": "SZSE" },
            { "code": "00008", "name": "PCCW", "exchange": "US" },
            { "code": "00009", "name": "MANDARIN ENT", "exchange": "SEHK" },
            { "code": "00010", "name": "HANG LUNG GROUP", "exchange": "SEHK" }
        ];
        return (
            <div className="">
                {
                    contList.map((item, index) => {
                        return (
                            <List key={index}>
                                <ListItem truncate href={`#------${index}------`}>
                                    <p>{item.code}</p>
                                    <p>{item.name}</p>
                                    <p>{item.exchange}</p>
                                </ListItem>
                            </List>
                        );
                    })
                }

            </div>
        )
    },

    render() {
        var btnSearch = (<Button>Cancel</Button>);
        return (
            <div>
                <Container className="itrader-module itrader-mgtop10">
                    <div className="itrader-marketSearch">
                        <Input placeholder="default sm" amSize="sm" placeholder="代号" btnAfter={btnSearch} />
                    </div>
                </Container>
                <div className="itrader-mgtop10 itrader-module">
                    {this.marketHead()}
                </div>
                <Container className="itrader-module itrader-mgtop10">
                    {this.marketCont()}
                </Container>
            </div>
        );
    }

});

export default Market;
