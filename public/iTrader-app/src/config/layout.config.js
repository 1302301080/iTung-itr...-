module.exports = {
    "tabbar": {
        "list": [
            // {
            //     "link": "/market",
            //     "icon": "javascripts/app/images/Market.png",
            //     "selectedIconPath": "javascripts/app/images/Market.png",
            //     "title": messages.app_tabs_market.text
            // },
            {
                "link": "/trade",
                "icon": "javascripts/app/images/Trade.png",
                "selectedIconPath": "javascripts/app/images/Trade.png",
                "title": messages.app_tabs_trading.text
            },
            //  {
            //     "link": "/fund",
            //     "icon": "app/images/Trade.png",
            //     "selectedIconPath": "app/images/Trade.png",
            //     "title": messages.app_tabs_fund_trading.text
            // },
            // {
            //     "link": "/otc",
            //     "icon": "app/images/LoginUser.png",
            //     "selectedIconPath": "app/images/LoginUser.png",
            //     "title": "OTC"
            // },
            {
                "link": "/account",
                "icon": "javascripts/app/images/LoginUser.png",
                "selectedIconPath": "javascripts/app/images/LoginUser.png",
                "title": messages.app_tabs_account.text
            }
        ]
    },
    "page": {
        "list": [
            {
                "id": 'buy',
                "title": messages.app_nav_buy.text,
                "link": "/trade/buy",
            },
            {
                "title": messages.app_nav_sell.text,
                "link": "/trade/sell",
            },
            {
                "title": messages.app_nav_cancel.text,
                "link": "/trade/cancel",
            },
            {
                "title": messages.app_nav_order.text,
                "link": "/trade/order",
            },
            {
                "title": messages.app_nav_position.text,
                "link": "/trade/position",
            }
        ]
    },
    "account": {
        "user": [
            {
                "name": messages.app_column_account_name.text,
                "key": "name",
                "i18n": 'column_cash_balance',
            },
            {
                "name": messages.app_column_account_id.text,
                "key": "id",
                "i18n": 'column_cash_balance',
            },
            {
                "name": messages.app_column_account_user_type.text,
                "key": "margin_type",
                "i18n": 'column_cash_balance',
            },
            {
                "name": messages.app_column_account_last_login_time.text,
                "key": "lastLoginTime",
                "i18n": 'column_cash_balance',
            },
            {
                "name": messages.app_column_account_last_login_app.text,
                "key": "lastLoginApp",
                "i18n": 'column_cash_balance',
            },
        ],
        "list": [
            {
                "name": messages.app_column_assets.text,
                "key": "netAssetValue",
                "alias": 'CB',
                "collection": "0"
            },
            {
                "name": messages.app_column_marketValue.text,
                "key": "marketValue",
                "collection": "1"
            },
            {
                "name": messages.app_column_summary_unrealizedPL.text,
                "key": "unrealizedPL",
                "alias": 'TL',
                "collection": "1"
            },
            {
                "name": messages.app_column_balance.text,
                "key": "156",
                "collection": "2"
            },
            {
                "name": messages.app_column_trading_limit.text,
                "key": "155",
                "collection": "2"
            },
            {
                "name": messages.app_column_initial_trading_limit.text,
                "key": "185",
                "collection": "3"
            },
            {
                "name": messages.app_column_initial_cash_balance.text,
                "key": "186",
                "collection": "3"
            },
            {
                "name": messages.app_column_acceptValue.text,
                "key": "acceptValue",
                "collection": "3"
            }
        ]
    }
}