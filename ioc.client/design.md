Design for automated access to Hybridd


Client: An association that is set on introducing crypto currencies to African region as way of making people more financially capable.

Use cases: Developing very easy to use payment software, Point of Sale for shops, insurances, tokens for medical treatment at clinincs.

Requirement : Enabling interfaces to IoC back-end (hybridd) using the API for complete payments.


I describe four distinct requirements:

1) Information gathering : checking balances, payment history and transaction details.

2) Main Seed generation : using a username and password to generate the main seed.

3) Key and Address generation: using the Main seed to generate the keys and addresses for all different assets.

4) Transaction signing : using the keys and addresses to generate and sign transactions.


Currently feature 1) is handled directly by our API:

/asset/$SYMBOL/balance/$ADDRESS
/asset/$SYMBOL/history/$ADDRESS
/asset/$SYMBOL/transaction/$TRANSACTION_ID

Features 3) and 4) are also provided in the form of a "Deterministic Code Blob" which is also retrievable through the API.

/source/deterministic/code/$SYMBOL


The remaining feature 2) Main Seed generation is currently performed by the login procedure of the wallet. This is a process that still requires user interaction. To facilitate automation I suggest packing the required code into a Code Blob in the form a function with the following input:

- Username
- Password
- Host(s) : the hybridd node endpoint(s) (for example ["wallet1.internetofcoins.org:1111", "wallet2.internetofcoins.org:1111"])
- DataCallback : the asynchronious function that is executed when the seed is retrieved
- ErrorCallback : the asynchronious function that is executed when an error is encountered

The outcomes would be either calling the DataCallbak function with the Main Seed as a parameter or the ErrorCallback with an error message specifying what went wrong.
