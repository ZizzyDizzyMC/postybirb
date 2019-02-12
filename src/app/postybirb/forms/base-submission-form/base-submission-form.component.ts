import { Component, OnDestroy, Injector, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { ProfileStatuses, LoginManagerService } from 'src/app/login/services/login-manager.service';
import { Subscription, Subject, Observable } from 'rxjs';
import { Submission } from 'src/app/database/models/submission.model';
import { WebsiteRegistryEntry } from 'src/app/websites/registries/website.registry';
import { TypeOfSubmission } from 'src/app/utils/enums/type-of-submission.enum';
import { FormGroup } from '@angular/forms';
import { LoginStatus } from 'src/app/websites/interfaces/website-service.interface';
import { MatDialog } from '@angular/material';
import { ISubmission } from 'src/app/database/tables/submission.table';
import { DescriptionInput } from 'src/app/utils/components/description-input/description-input.component';
import { TagInput } from 'src/app/utils/components/tag-input/tag-input.component';
import { LoginProfileSelectDialog } from 'src/app/login/components/login-profile-select-dialog/login-profile-select-dialog.component';

@Component({
  selector: 'base-submission-form',
  template: '<div></div>',
})
export class BaseSubmissionForm implements AfterViewInit, OnDestroy {
  @ViewChild('defaultTags') defaultTags: TagInput;
  @ViewChild('defaultDescription') defaultDescription: DescriptionInput;

  protected loginStatuses: ProfileStatuses = {};
  protected loginListener: Subscription = Subscription.EMPTY;

  public submission: Submission;
  public loading: boolean = false;
  public hideForReload: boolean = false;
  public triggerWebsiteReload: boolean = true;
  public availableWebsites: WebsiteRegistryEntry = {};

  public basicInfoForm: FormGroup;
  public formDataForm: FormGroup;
  public typeOfSubmission: TypeOfSubmission;
  public resetSubject: Subject<void> = new Subject();
  public onReset: Observable<void> = this.resetSubject.asObservable();

  protected _changeDetector: ChangeDetectorRef;
  protected dialog: MatDialog;
  protected _loginManager: LoginManagerService;

  constructor(injector: Injector) {
    this._changeDetector = injector.get(ChangeDetectorRef);
    this.dialog = injector.get(MatDialog);
    this._loginManager = injector.get(LoginManagerService);

    this.loginListener = this._loginManager.statusChanges.subscribe(statuses => {
      this.loginStatuses = statuses;
      this._changeDetector.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.triggerWebsiteReload = false;
    this._changeDetector.markForCheck();
  }

  ngOnDestroy() {
    this.resetSubject.complete();
    this.loginListener.unsubscribe();
  }

  public toggleLogin(): void {
    loginPanel.toggle();
  }

  public openProfileSelect(): void {
    this.dialog.open(LoginProfileSelectDialog)
      .afterClosed()
      .subscribe(profile => {
        if (profile) {
          this.formDataForm.controls.loginProfile.setValue(profile.id);
          this._changeDetector.markForCheck();
        }
      });
  }

  public isLoggedIn(website: string): boolean {
    try {
      if (this.loginStatuses && this.formDataForm && this.formDataForm.value.loginProfile) {
        if (this.loginStatuses[this.formDataForm.value.loginProfile][website]) {
          return this.loginStatuses[this.formDataForm.value.loginProfile][website].status === LoginStatus.LOGGED_IN;
        }
      }
    } catch (e) {
      // Catching because electron has a weird issue here
    }

    return false;
  }

  public getLoginProfileId(): string {
    return this.formDataForm.value.loginProfile;
  }

  protected _copySubmission(submission: ISubmission): void {
    if (submission.formData) this.formDataForm.patchValue(submission.formData || {});
    if (submission.rating) this.basicInfoForm.patchValue({ rating: submission.rating });
    this._changeDetector.markForCheck();
  }

}
