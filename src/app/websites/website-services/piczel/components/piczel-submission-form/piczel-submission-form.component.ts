import { Component, OnInit, Injector, forwardRef, AfterViewInit } from '@angular/core';
import { Folder } from 'src/app/websites/interfaces/folder.interface';
import { BaseWebsiteSubmissionForm } from 'src/app/websites/components/base-website-submission-form/base-website-submission-form.component';
import { FormControl } from '@angular/forms';
import { SubmissionRating } from 'src/app/database/tables/submission.table';

@Component({
  selector: 'piczel-submission-form',
  templateUrl: './piczel-submission-form.component.html',
  styleUrls: ['./piczel-submission-form.component.css'],
  providers: [{ provide: BaseWebsiteSubmissionForm, useExisting: forwardRef(() => PiczelSubmissionForm) }],
  host: {
    'class': 'submission-form'
  }
})
export class PiczelSubmissionForm extends BaseWebsiteSubmissionForm implements OnInit, AfterViewInit {

  public optionDefaults: any = {
    nsfw: [false],
    folder: []
  };

  public folders: Folder[] = [];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.folders = this.websiteService.getFolders(this.parentForm.getLoginProfileId()) || [];
    if (!this.formGroup.get('tags')) this.formGroup.addControl('tags', new FormControl(null));
    if (!this.formGroup.get('description')) this.formGroup.addControl('description', new FormControl(null));
    if (!this.formGroup.get('options')) this.formGroup.addControl('options', this.formBuilder.group(this.optionDefaults));

    if (this.rating === SubmissionRating.ADULT || this.rating === SubmissionRating.EXTREME) {
      this.formGroup.controls.options.patchValue({ nsfw: true });
    }
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.folders) {
      this.resetOnConflict('folder', this.getIdsFromFolders(this.folders));
    }
  }

}
