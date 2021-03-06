import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpService } from "../http.service";
import { GlobalService } from '../global.service'
import {ActivatedRoute, Params, Route, Router} from "@angular/router";
import { Title }     from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';

declare var Stripe: any;
declare var $: any;
declare var run: any;

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {
  //events
  content: string;
  postDate: string;
  title: string;
  creatorName: any;
  creatorIcon: string;
  cover: string;
  views: number;
  images: string[];
  tags: string[];
  comments: any[];
  commentsCount: number;
  liksCount: number;
  eventStartTime: string;
  price: number;
  priceText: string;
  isFree: boolean;
  isAlreadyJoin:boolean;
  seatSelection:boolean;

  deadtimeInvalid: boolean;

  modalTarget: string;

  shareTitle = "分享活动 - ";

  paymentModel = { email: '', name: ''};
  joinModel = { email: '', name: ''};


  // join group
  private groupData = { groupid: '', groupname: ''};

  // // joined  before
  // joined: boolean = false;
  // userId_link = '';

  //payment

  form = {username:'', group:'', price:-1, orginalPrice:-1, seatIndex:-1, stripeEmail:'', stripeToken: '', Systemlanguage: ''};
  freeForm = {stripeEmail: '', Systemlanguage: '', username: ''};

  ticketNames: string[];
  ticketPrices: number[];
  ticketQuantities: number[];
  seats: any[];
  selectedSeatList: number[];
  des: string;

  selectedListIndex: number;
  selectedSeat: number;
  userLanguage: string;
  userEmail : string;
  username : string;
  validCard: boolean;
  type: boolean;
  link: string;

  eventId: string;
  trans:TranslateService;
  photoServerUrl = "https://dhjjgq45wu4ho.cloudfront.net/";

  //eventName = "event title";
  constructor( private g: GlobalService,private translate:TranslateService, private http: HttpService, private route: ActivatedRoute, private router: Router, private titleService: Title) {
    this.trans = translate;
    this.eventStartTime = "2100-10-13T11:13:00.000Z";
    this.creatorIcon = this.photoServerUrl + "group08.png";
    this.route.params.forEach((params: Params) => {
      this.eventId = params['postId'];
      this.isAlreadyJoin = false;

      console.log("id: " + this.eventId);

      this.http.getEventInfo(this.eventId).subscribe(
          data => {
            console.log(data);

            // // For user login again
            // console.log('userId is: ' + data.link);
            // console.log("Has joined:" + data.type);
            // this.joined = data.type;
            // this.userId_link = data.link;
            //

            if(data.length === 0) {
              window.location.href = "https://chumi.co/app";
            }
            this.type = data.type;
            this.link = data.link;
            this.content = data.content;
            console.log(this.content);
            this.postDate = data.postDate;
            this.title = data.title;
            this.groupData.groupname = data.title;
            this.setTitle(this.title);
            this.creatorIcon = this.photoServerUrl + data._creator.userPhoto;
            this.cover = this.photoServerUrl + data.cover;
            this.views = data.viewers;
            this.seatSelection = data.seatSelection;

            this.shareTitle += this.title;
            this.des = this.content;

            this.deadtimeInvalid = data.DeadTime === "2100-10-13T11:13:00.000Z";

            console.log("seatSelection: " + this.seatSelection);

            this.modalTarget = this.seatSelection ? "#seatSelect" : "#payment-modal";

            this.creatorName = data._creator.username;
            this.images = data.image;
            if (this.images.length > 8) {
              this.images = this.images.slice(0, 8);
            }
            this.tags = data.tags;

            this.liksCount = data.likes.length;
            this.eventStartTime = data.DeadTime;
            this.price = data.price;


            if (this.price > 0) {
              this.trans.get('参与价格： $').subscribe((res: string) => {
                this.priceText = res + this.price;
                this.isFree = false;
              });

            } else {
              this.trans.get('本活动免费').subscribe((res: string) => {
                this.priceText = res;
                this.isFree = true;
              });
            }

            if(this.type && this.link != ""){
              this.isAlreadyJoin = true;
            }


            console.log(data);
            console.log(this.images);

            new run();


          },
          error => {
              alert(error);
          }
      );

    });
  }
  setTitle( newTitle: string) {
    this.titleService.setTitle( newTitle );

  }

  ngOnInit() {

    this.validCard = false;

    this.http.getComments(this.eventId).subscribe(
        data => {
          this.comments = data;
          this.commentsCount = data.length;
          console.log(data);

        },
        error => {
            alert(error);
        }
    );

    if(navigator.language == "zh-CN") {
      this.userLanguage = "Chinese";
    }
    else {
      this.userLanguage = "English";
    }

    var stripe = Stripe('pk_live_fv6E5eo1rKZdm2F22cBJTRIF');
    var elements = stripe.elements();

    var card = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          iconColor: '#666EE8',
          color: '#31325F',
          lineHeight: '40px',
          fontWeight: 300,
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSize: '15px',

          '::placeholder': {
            color: '#CFD7E0',
          },
        },
      }
    });
    card.mount('#card-element');

    var setOutcome = result => {
      var errorElement = document.querySelector('.error');
      var paybutton = document.querySelector('.paybutton');
      errorElement.classList.remove('visible');

      if (result.token) {
        // Use the token to create a charge or a customer
        // https://stripe.com/docs/charges
        // successElement.querySelector('.token').textContent = result.token.id;
        // successElement.classList.add('visible');

        //console.log(this.form);
        paybutton.textContent = "Paying, please wait.";
        var originalPrice = this.ticketPrices[this.selectedListIndex] * 100;

        this.form['group'] = this.eventId;
        this.form['username'] = this.username;
        this.form['price'] = originalPrice + Math.floor((originalPrice * 0.029 + 30)/(1-0.029));
        this.form['orginalPrice'] = originalPrice;
        this.form['seatIndex'] = this.selectedSeat;
        this.form['stripeEmail'] = this.userEmail;
        this.form['stripeToken'] = result.token.id;
        this.form['Systemlanguage'] = this.userLanguage;
        this.form["acWebId"] = this.eventId;

        this.http.chargeCard(this.form).subscribe(
            data => {
                console.log("TYITIT"+data);
                console.log(data.invoiceId);
                //支付成功跳转 invoice/:invoiceId
              let userId = data.userId;
              localStorage.setItem('id_token', userId);
              this.closeAllModal();
              this.g.getUserInfo();
              GlobalService.data.userId = data.userId;
              this.joinGroup();
              localStorage.setItem(GlobalService.data.isFreeEvent, 'No');
              localStorage.setItem(GlobalService.data.invoiceId, data.invoiceId);
              // this.router.navigateByUrl(`/chat/user/${userId}/group/${this.eventId}`);
              this.router.navigateByUrl(`/invoice/${data.invoiceId}/user/${userId}`);
                //this.closeAllModal();
            },
            error => {
                alert("Something wrong with payment, please try again.");
            }
        );

      } else if (result.error) {
        errorElement.textContent = result.error.message;
        errorElement.classList.add('visible');
      }
    }

    card.on('change', function(event) {
      setOutcome(event);
    });

    document.querySelector('.payform').addEventListener('submit', function(e) {
      e.preventDefault();
      var theform = document.querySelector('.payform');
      var extraDetails = {
        name: (<HTMLInputElement>theform.querySelector('input[name=cardholder-name]')).value,
        useremail: (<HTMLInputElement>theform.querySelector('input[name=user-email]')).value,
      };
      stripe.createToken(card, extraDetails).then(setOutcome);
    });

    this.groupData.groupid = this.eventId;
    this.groupData.groupname = this.title;

  }

  calculateFee(originalPrice) {
    return Math.floor((originalPrice * 0.029 + 30)/(1-0.029));
  }

  clickTicket(key) {
    this.selectedSeatList = this.seats[key];
    this.selectedListIndex = key;
    //this.selectedSeats = [];

    if(!this.seatSelection) {
      this.selectedSeat = 0;
    }
  }

  buyTicket(key) {

    this.selectedSeat = key;
  }

  onKeyEmail(event: any) { // without type info
    this.userEmail = event.target.value;
  }

  onKeyUsername(event: any) { // without type info
    this.username = event.target.value;
  }

  alreadyJoin(){
    this.router.navigateByUrl(`/chat/user/${this.link}/group/${this.eventId}`);
  }

  joinEvent() {
    //
    this.http.getTicketInfo(this.eventId).subscribe(
        data => {
          this.ticketNames = data.name;
          this.ticketPrices = data.price;
          this.ticketQuantities = data.quantity;
          this.seats = data.seats;
          this.selectedSeatList = this.seats[0];
          console.log(this.ticketPrices);
        },
        error => {
            alert(error);
        }
      );
  }

  joinEventFree(){

  }

  closeAllModal() {
    $('.modal').modal('hide');
  }

  joinGroup() {
    this.http.joinGroup(this.groupData).subscribe(
      data => {
        console.log('join group successfully!');
      },
      error => {
        console.log('Join group error');
      }
    );
  }

  submitJoinFree() {

    this.freeForm['username'] = this.username;
    this.freeForm['stripeEmail'] = this.userEmail;
    this.freeForm['Systemlanguage'] = this.userLanguage;
    this.freeForm["acWebId"] = this.eventId;
    this.http.joinEventFree(this.freeForm).subscribe(
            data => {
                console.log(data);
                let userId = data.userId;
                localStorage.setItem('id_token', userId);
                this.closeAllModal();
                this.g.getUserInfo();
                GlobalService.data.userId = data.userId;
                GlobalService.data.groupId = this.eventId;
                this.joinGroup();
                localStorage.setItem(GlobalService.data.isFreeEvent, 'Yes' );
                // this.router.navigateByUrl(`/chat/user/${userId}/group/${this.eventId}`);
                this.router.navigateByUrl(`/invoice/${this.eventId}`);
            },
            error => {
                // alert(error);
                console.error('Error:' + error);
            }
        );
  }

}

