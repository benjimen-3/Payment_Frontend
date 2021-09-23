export interface TransactionReq{
    transferType:string;
	messageCode:string;
	amount:number;
	receiverAcctNumber:string;
	receiverName:string;
	senderAcctNumber:string;
	receiverBic:string;
}