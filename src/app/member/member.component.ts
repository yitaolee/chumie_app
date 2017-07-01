import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Params} from "@angular/router";
import {HttpService} from "../http.service";

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.css'],
  providers: [HttpService]
})
export class MemberComponent implements OnInit {
  userId:number;
  userName: string;
  cityToLive: string;
  occupation: string;
  description: string;
  userPhotoUrl: string;
  postCount: number;
  myCircle: number;
  following: number;
  genderImgUrl: string;
  cachedId: string;

  maleImgUrl = "/assets/img/male.png";
  femaleImgUrl = "/assets/img/female.png";

  constructor(private http: HttpService,private route: ActivatedRoute) { }

  ngOnInit() {
    this.cachedId = localStorage.getItem('id_token');

    console.log(this.cachedId);

    this.route.params.forEach((params: Params) => {
      this.userId = params['userId'];
    });

    this.http.getUserInfo(this.userId).subscribe(
            data => {
              this.userName = data.username;
              this.cityToLive = data.cityToLive;
              this.occupation = data.occupation;
              this.description = data.description;
              this.userPhotoUrl = data.userPhoto;
              this.postCount = +data.acTotalNumberCount;
              this.myCircle = +data.myVipChannel.length;
              this.following = +data.vipTags.length - 1;
              this.userPhotoUrl = "http://dhjjgq45wu4ho.cloudfront.net/" + data.userPhoto;
              this.genderImgUrl = this.femaleImgUrl;
              if(data.gender == "Male") {
                this.genderImgUrl = this.maleImgUrl;
              }
              else {
                this.genderImgUrl = this.femaleImgUrl;
              }
            },
            error => {
                alert(error);
            }
        );

  }

}