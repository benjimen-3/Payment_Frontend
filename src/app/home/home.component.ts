import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { BankBic } from '../models/bankBic';
import { Customer } from '../models/customer';
import { MessageCode } from '../models/messageCode';
import { TransactionReq } from '../models/transaction';
import { HomeService } from './homeService/home.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  //forms
  senderForm!: FormGroup;
  receiverForm!: FormGroup;
  transactionForm!: FormGroup;

  messageCodes!: MessageCode[];
  accountDetailsLoading: boolean = false;

  constructor(private _formBuilder: FormBuilder, private homeService: HomeService, private http: HttpClient) {
  }

  ngOnInit(): void {
    this.senderForm = this._formBuilder.group({
      "accountNumber": ['', [Validators.required, Validators.maxLength(14), Validators.minLength(14)]],
      "accountHolderName": [{ value: '', disabled: true }],
      "clearBalance": [{ value: '0', disabled: true }]
    });
    this.receiverForm = this._formBuilder.group({
      "bic": ['', [Validators.required, Validators.maxLength(11), Validators.minLength(11)]],
      "bankName": [{ value: '', disabled: true }],
      "accountHolderName": [''],
      "accountHolderNumber": ['']
    });
    this.transactionForm = this._formBuilder.group({
      "transferType": ['customer'],
      "messageCode": ['', [Validators.required]],
      "amount": ['', [Validators.required]],
      "transferFee": [{ value: '', disabled: true }]
    });


    this.accountNumberField?.statusChanges.subscribe(status => {
      if (status === "VALID") {
        let accountNumber: string = this.accountNumberField?.value;
        this.homeService.getCustomerDetails(accountNumber)
          .subscribe((cust: Customer) => {
            this.senderForm.patchValue({
              "accountHolderName": cust.accountholdername,
              "clearBalance": cust.clearbalance
            });
            console.log(cust);
          },(error)=> {
            this.senderForm.patchValue({
              "accountHolderName":'',
              "clearBalance":'0'
            });
          });
      }
      console.log(this.accountNumberField);
    });

    this.bicField?.statusChanges.subscribe(status => {
      if (status === "VALID") {
        let bic: string = this.bicField?.value;
        this.homeService.getBankDetails(bic)
          .subscribe((bic: BankBic) => {
            this.receiverForm.patchValue({
              "bankName": bic.bankname
            });
            console.log(bic);
          },(error)=> {
            this.receiverForm.patchValue({
              "bankName":'',
            });
          });
      }
    });

    this.homeService.getAllMessageCodes().subscribe((msgCodes: MessageCode[]) => {
      this.messageCodes = msgCodes;
      console.log(this.messageCodes);
    });

  }

  get accountNumberField() {
    return this.senderForm.get("accountNumber");
  }

  get bicField() {
    return this.receiverForm.get("bic") as FormControl;
  }

  accountIdValidator(acctId: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (acctId.length === 14) {
        this.homeService.getCustomerDetails(acctId).subscribe((customer: Customer) => {
          console.log(customer);
          return null;
        }, () => {
          return { accountIdInvalid: true };
        });
      }
      return { accountIdIncorrectSize: true };
    };
  }

  convertToFormControl(absCtrl: AbstractControl | null): FormControl {
    const ctrl = absCtrl as FormControl;
    return ctrl;
  }

  onTransactionSubmit(){
     let trans:TransactionReq = {
       transferType: this.transactionForm.get('transferType')?.value,
       messageCode: this.transactionForm.get('messageCode')?.value,
       amount: this.transactionForm.get('amount')?.value,
       receiverAcctNumber: this.receiverForm.get('accountHolderNumber')?.value,
       receiverName: this.receiverForm.get('accountHolderName')?.value,
       senderAcctNumber: this.accountNumberField?.value,
       receiverBic: this.bicField?.value
     };
     console.log(trans);
     this.homeService.postTransaction(trans).subscribe((data)=> {
       console.log(data);
     },(error)=> {
       console.log(error);
     })
  }



}

/*
{
    "transactionId": 4,
    "amount": 12.0,
    "receiverAccountNumber": "12345678912345",
    "receiverName": "OSAMA BIN LADEN",
    "customer": {
        "accountNumber": "71319440983198",
        "name": "A M MAYANNA",
        "clearBalance": 203937.97,
        "overdraft": "NO"
    },
    "messageCode": {
        "messageCode": "CHQB",
        "description": "beneficiary customer must be paid by cheque only."
    },
    "receiverBic": {
        "bic": "ABBLINBBXXX",
        "name": "AB BANK LIMITED"
    },
    "timestamp": "2021-09-09T14:20:49.431+00:00"
}

*/
