import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeadService } from '../../services/lead.service';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html'
})
export class LeadsComponent implements OnInit {
  // Grids/Lists state
  leads: any[] = [];
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  
  // Search, sort, filters
  search = '';
  sortBy = 'createdAt';
  sortOrder = 'DESC';
  filterStatus = '';
  filterSource = '';

  // Mode & selection state
  activeView: 'list' | 'detail' | 'form' = 'list';
  selectedLead: any = null;
  followUps: any[] = [];

  // Forms
  leadForm!: FormGroup;
  followUpForm!: FormGroup;
  leadFormMode: 'add' | 'edit' = 'add';
  submittedLead = false;
  submittedFollowUp = false;

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService
  ) {}

  ngOnInit() {
    this.loadLeads();
    this.initForms();
  }

  initForms() {
    this.leadForm = this.fb.group({
      leadName: ['', Validators.required],
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      source: ['', Validators.required],
      status: ['New'],
      expectedDealAmount: [0, [Validators.required, Validators.min(0)]]
    });

    this.followUpForm = this.fb.group({
      followUpDate: [new Date().toISOString().split('T')[0], Validators.required],
      followUpType: ['Call', Validators.required],
      notes: [''],
      outcome: ['', Validators.required],
      nextFollowUpDate: ['']
    });
  }

  loadLeads() {
    this.leadService.getLeads({
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.search,
      status: this.filterStatus,
      source: this.filterSource
    }).subscribe({
      next: res => {
        this.leads = res.leads;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
      },
      error: err => console.error('Error fetching leads:', err)
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadLeads();
  }

  onFilter() {
    this.currentPage = 1;
    this.loadLeads();
  }

  onSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadLeads();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadLeads();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadLeads();
  }

  // Create/Edit Lead Submit
  onSubmitLead() {
    this.submittedLead = true;
    if (this.leadForm.invalid) return;

    const data = this.leadForm.value;
    if (this.leadFormMode === 'add') {
      this.leadService.createLead(data).subscribe({
        next: () => {
          this.activeView = 'list';
          this.loadLeads();
        },
        error: err => console.error('Error adding lead:', err)
      });
    } else {
      this.leadService.updateLead(this.selectedLead.id, data).subscribe({
        next: () => {
          this.activeView = 'list';
          this.loadLeads();
        },
        error: err => console.error('Error updating lead:', err)
      });
    }
  }

  // Follow-up Submit
  onSubmitFollowUp() {
    this.submittedFollowUp = true;
    if (this.followUpForm.invalid) return;

    this.leadService.createFollowUp(this.selectedLead.id, this.followUpForm.value).subscribe({
      next: () => {
        this.submittedFollowUp = false;
        this.followUpForm.reset({
          followUpDate: new Date().toISOString().split('T')[0],
          followUpType: 'Call',
          notes: '',
          outcome: '',
          nextFollowUpDate: ''
        });
        // Reload details and follow-ups
        this.viewDetails(this.selectedLead.id);
      },
      error: err => console.error('Error adding follow-up:', err)
    });
  }

  // Open Form
  openAddForm() {
    this.leadFormMode = 'add';
    this.submittedLead = false;
    this.leadForm.reset({
      leadName: '',
      companyName: '',
      email: '',
      phone: '',
      source: 'Website',
      status: 'New',
      expectedDealAmount: 0
    });
    this.activeView = 'form';
  }

  openEditForm(lead: any) {
    this.leadFormMode = 'edit';
    this.selectedLead = lead;
    this.submittedLead = false;
    this.leadForm.setValue({
      leadName: lead.leadName,
      companyName: lead.companyName,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      expectedDealAmount: lead.expectedDealAmount
    });
    this.activeView = 'form';
  }

  viewDetails(leadId: number) {
    this.leadService.getLead(leadId).subscribe({
      next: lead => {
        this.selectedLead = lead;
        this.leadService.getFollowUps(leadId).subscribe({
          next: fList => {
            this.followUps = fList;
            this.activeView = 'detail';
          }
        });
      }
    });
  }

  deleteLead(leadId: number) {
    if (confirm('Are you sure you want to delete this lead?')) {
      this.leadService.deleteLead(leadId).subscribe({
        next: () => {
          this.loadLeads();
        },
        error: err => {
          alert(err.error?.message || 'Failed to delete lead.');
        }
      });
    }
  }

  downloadPdfReport() {
    this.leadService.downloadPdf({
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.search,
      status: this.filterStatus,
      source: this.filterSource
    }).subscribe({
      next: (blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'leads_report.pdf';
        link.click();
      },
      error: (err) => console.error('Failed to export leads PDF:', err)
    });
  }

  isOverdue(followUp: any): boolean {
    if (!followUp || !followUp.nextFollowUpDate) return false;
    if (this.selectedLead.status !== 'New' && this.selectedLead.status !== 'Contacted') return false;
    const nextDate = new Date(followUp.nextFollowUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nextDate < today;
  }
}
