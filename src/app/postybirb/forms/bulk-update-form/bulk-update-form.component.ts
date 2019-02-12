import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, forwardRef, OnDestroy, Injector } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { Submission } from 'src/app/database/models/submission.model';
import { ConfirmDialog } from 'src/app/utils/components/confirm-dialog/confirm-dialog.component';
import { SubmissionType, ISubmission } from 'src/app/database/tables/submission.table';
import { LoginProfileManagerService } from 'src/app/login/services/login-profile-manager.service';
import { debounceTime } from 'rxjs/operators';
import { WebsiteRegistry } from 'src/app/websites/registries/website.registry';
import { SubmissionSelectDialog } from '../../components/submission-select-dialog/submission-select-dialog.component';
import { BaseSubmissionForm } from '../base-submission-form/base-submission-form.component';
import { SubmissionCache } from 'src/app/database/services/submission-cache.service';

@Component({
  selector: 'bulk-update-form',
  templateUrl: './bulk-update-form.component.html',
  styleUrls: ['./bulk-update-form.component.css'],
  providers: [{ provide: BaseSubmissionForm, useExisting: forwardRef(() => BulkUpdateForm) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkUpdateForm extends BaseSubmissionForm implements OnInit, AfterViewInit, OnDestroy {
  private readonly BULK_STORE: string = 'bulk-form-store';

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private _submissionCache: SubmissionCache,
    private _loginProfileManager: LoginProfileManagerService,
  ) {
    super(injector);
  }

  ngOnInit() {
    this.loading = true;
    this.availableWebsites = WebsiteRegistry.getRegistered() || {};
    this.submission = new Submission(<any>{ id: -1 }); // Create stub submission
    this.submission.formData = store.get(this.BULK_STORE) || {};
    this._initializeFormDataForm();

    this.loading = false;
    this._changeDetector.markForCheck();
  }

  private _initializeFormDataForm(): void {
    this.formDataForm = this.fb.group({
      loginProfile: [this._loginProfileManager.getDefaultProfile().id, Validators.required],
      defaults: this.fb.group({
        description: [null],
        tags: [null]
      })
    });

    this.formDataForm.addControl('websites', new FormControl([], { updateOn: 'blur', validators: [Validators.required] }));

    Object.keys(this.availableWebsites).forEach(website => {
      this.formDataForm.addControl(website, this.fb.group({
        // fields will be added by lower components
      }));
    });

    this.formDataForm.patchValue(this.submission.formData || {});

    this.formDataForm.controls.loginProfile.valueChanges
      .subscribe(() => {
        this.triggerWebsiteReload = true;
        this._changeDetector.detectChanges();
        this.triggerWebsiteReload = false;
        this._changeDetector.detectChanges();
        this._changeDetector.markForCheck();
      });

    this.formDataForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(changes => {
        this.submission.formData = changes;
        store.set(this.BULK_STORE, changes);
      });
  }

  public clear(): void {
    this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Clear'
      }
    }).afterClosed()
      .subscribe(doClear => {
        if (doClear) {
          this.formDataForm.reset();
          this.resetSubject.next();
          store.remove(this.BULK_STORE);
        }
      });
  }

  public saveBulkUpdates(): void {
    this.loading = true;
    this.dialog.open(SubmissionSelectDialog, {
      data: {
        title: 'Save',
        type: SubmissionType.SUBMISSION,
        multiple: true
      }
    }).afterClosed()
      .subscribe((submissions: ISubmission[]) => {
        if (submissions && submissions.length) {
          submissions.forEach(submission => {
            this._submissionCache.get(submission.id).formData = this.formDataForm.value;
          });
        }

        this.loading = false;
        this._changeDetector.markForCheck();
      });
  }

  public openCopySubmission(): void {
    this.dialog.open(SubmissionSelectDialog, {
      data: {
        title: 'Copy',
        type: SubmissionType.SUBMISSION
      }
    })
      .afterClosed()
      .subscribe((toCopy: ISubmission) => {
        if (toCopy) {
          this._copySubmission(toCopy);
        }
      });
  }

}
