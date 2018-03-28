module.exports = {
    BOND: [
        {
            type: 'panel', columns: [
                { name: 'ticket', path: 'bond_ticket.ejs', class: 'col-lg-7 col-md-7 col-sm-12', i18n: '' },
                { name: 'account balance', path: 'account.ejs', class: 'col-lg-5 col-md-5 col-sm-12', i18n: '' },
            ]
        },
        {
            type: 'tab', class: 'col-lg-12', columns: [
                { name: 'price_quote_book', path: 'bond_quote_book.ejs', i18n: '' },
                { name: 'portfolio', path: 'portfolio.ejs', class: 'col-lg-6 col-md-12 col-sm-12', i18n: 'tabs_bond_portfolio' },
                { name: 'order_book', path: 'bond_orderbook.ejs', i18n: '' },
                { name: 'daily_bond', path: 'bond_daily_list.ejs', i18n: 'tabs_bond_dailyList' },
            ]
        }
    ],
    FUND: [
        {
            type: 'panel', columns: [
                { name: 'ticket', path: 'fund_ticket.ejs', class: 'col-lg-7 col-md-7 col-sm-12', i18n: '' },
                { name: 'account balance', path: 'account.ejs', class: 'col-lg-5 col-md-5 col-sm-12', i18n: '' },
            ]
        },
        {
            type: 'tab', class: 'col-lg-12', columns: [
                { name: 'fund_list', path: 'fund_market.ejs', i18n: 'fund_market_panel_title' },
                { name: 'portfolio', path: 'portfolio.ejs', class: 'col-lg-6 col-md-12 col-sm-12', i18n: 'tabs_bond_portfolio' },
                { name: 'fund_book', path: 'fund_orderbook.ejs', i18n: '' },
                // { name: 'price_quote_book', path: 'fund_quote_book.ejs', i18n: '' },
                // { name: 'portfolio', path: 'fund_portfolio.ejs', class: 'col-lg-6 col-md-12 col-sm-12', i18n: 'tabs_bond_portfolio' },
            ]
        }
    ],
}