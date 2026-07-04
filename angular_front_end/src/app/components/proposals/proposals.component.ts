import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ProposalService } from '../../services/proposal.service';
import { LeadService } from '../../services/lead.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-proposals',
  templateUrl: './proposals.component.html'
})
export class ProposalsComponent implements OnInit {
  // Lists
  proposals: any[] = [];
  qualifiedLeads: any[] = [];
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;

  // Search/Filters
  search = '';
  sortBy = 'createdAt';
  sortOrder = 'DESC';
  filterStatus = '';

  // Mode
  activeView: 'list' | 'detail' | 'form' = 'list';
  selectedProposal: any = null;
  proposalFormMode: 'add' | 'edit' = 'add';
  submittedProposal = false;

  // Form
  proposalForm!: FormGroup;

  // AI & Admin State
  aiLoading = false;
  isAdmin = false;

  constructor(
    private fb: FormBuilder,
    private proposalService: ProposalService,
    private leadService: LeadService,
    public authService: AuthService
  ) {
    this.isAdmin = this.authService.hasRole(['admin']);
  }

  ngOnInit() {
    this.loadProposals();
    this.loadQualifiedLeads();
    this.initForm();
  }

  initForm() {
    this.proposalForm = this.fb.group({
      leadId: ['', Validators.required],
      proposalDate: [new Date().toISOString().split('T')[0], Validators.required],
      validTill: ['', Validators.required],
      discountPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      notes: [''],
      items: this.fb.array([], Validators.required)
    });

    // Recalculate totals on discount and items changes
    this.proposalForm.get('discountPercent')?.valueChanges.subscribe(() => {
      this.calculateProposalTotals();
    });
  }

  get items(): FormArray {
    return this.proposalForm.get('items') as FormArray;
  }

  newItem(serviceName = '', quantity = 1, unitPrice = 0): FormGroup {
    const group = this.fb.group({
      serviceName: [serviceName, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [unitPrice, [Validators.required, Validators.min(0)]],
      lineTotal: [{ value: quantity * unitPrice, disabled: true }]
    });

    // Recalculate line total dynamically
    group.valueChanges.subscribe(val => {
      const lineTotal = (val.quantity || 0) * (val.unitPrice || 0);
      group.get('lineTotal')?.setValue(lineTotal, { emitEvent: false });
      this.calculateProposalTotals();
    });

    return group;
  }

  addItem() {
    this.items.push(this.newItem());
    this.calculateProposalTotals();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateProposalTotals();
  }

  // Auto calculate totals fields
  subTotal = 0;
  grandTotal = 0;

  calculateProposalTotals() {
    let sub = 0;
    this.items.controls.forEach(control => {
      const qty = control.get('quantity')?.value || 0;
      const price = control.get('unitPrice')?.value || 0;
      sub += qty * price;
    });
    this.subTotal = sub;
    const discountPct = this.proposalForm.get('discountPercent')?.value || 0;
    const discountAmount = (sub * discountPct) / 100;
    this.grandTotal = sub - discountAmount;
  }

  loadProposals() {
    this.proposalService.getProposals({
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.search,
      status: this.filterStatus
    }).subscribe({
      next: res => {
        this.proposals = res.proposals;
        this.totalItems = res.totalItems;
        this.totalPages = res.totalPages;
      },
      error: err => console.error('Error fetching proposals:', err)
    });
  }

  loadQualifiedLeads() {
    // Get all leads (no pagination, size 100) to find Qualified / Contacted status
    this.leadService.getLeads({ size: 100 }).subscribe({
      next: res => {
        this.qualifiedLeads = res.leads.filter((l: any) => l.status === 'Qualified' || l.status === 'Contacted');
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProposals();
  }

  onFilter() {
    this.currentPage = 1;
    this.loadProposals();
  }

  onSort(field: string) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortOrder = 'ASC';
    }
    this.loadProposals();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadProposals();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadProposals();
  }

  openAddForm() {
    this.proposalFormMode = 'add';
    this.submittedProposal = false;
    this.subTotal = 0;
    this.grandTotal = 0;
    this.initForm();
    this.addItem(); // add at least one row
    this.activeView = 'form';
  }

  openEditForm(proposal: any) {
    this.proposalFormMode = 'edit';
    this.selectedProposal = proposal;
    this.submittedProposal = false;

    // Load proposal details including items
    this.proposalService.getProposal(proposal.id).subscribe({
      next: data => {
        this.proposalForm.reset({
          leadId: data.leadId,
          proposalDate: data.proposalDate,
          validTill: data.validTill,
          discountPercent: data.discountPercent,
          notes: data.notes
        });

        // Set LeadId as disabled in edit mode
        this.proposalForm.get('leadId')?.disable();

        // Load items into FormArray
        this.items.clear();
        data.items.forEach((item: any) => {
          this.items.push(this.newItem(item.serviceName, item.quantity, item.unitPrice));
        });

        this.calculateProposalTotals();
        this.activeView = 'form';
      }
    });
  }

  onSubmitProposal() {
    this.submittedProposal = true;
    if (this.proposalForm.invalid) return;

    // Retrieve raw values since leadId might be disabled in edit mode
    const data = this.proposalForm.getRawValue();

    if (this.proposalFormMode === 'add') {
      this.proposalService.createProposal(data).subscribe({
        next: () => {
          this.activeView = 'list';
          this.loadProposals();
        },
        error: err => alert(err.error?.message || 'Error saving proposal.')
      });
    } else {
      this.proposalService.updateProposal(this.selectedProposal.id, data).subscribe({
        next: () => {
          this.activeView = 'list';
          this.loadProposals();
        },
        error: err => alert(err.error?.message || 'Error updating proposal.')
      });
    }
  }

  viewDetails(id: number) {
    this.proposalService.getProposal(id).subscribe({
      next: data => {
        this.selectedProposal = data;
        this.activeView = 'detail';
      }
    });
  }

  submitProposal(id: number) {
    this.proposalService.submitProposal(id).subscribe({
      next: (res) => {
        alert(res.message);
        this.viewDetails(id);
        this.loadProposals();
      }
    });
  }

  approveProposal(id: number) {
    this.proposalService.approveProposal(id).subscribe({
      next: () => {
        this.viewDetails(id);
        this.loadProposals();
      }
    });
  }

  rejectProposal(id: number) {
    this.proposalService.rejectProposal(id).subscribe({
      next: () => {
        this.viewDetails(id);
        this.loadProposals();
      }
    });
  }

  generateAiSummary() {
    this.aiLoading = true;
    this.proposalService.generateAiSummary(this.selectedProposal.id).subscribe({
      next: (res) => {
        this.selectedProposal.aiSummary = res.aiSummary;
        this.selectedProposal.aiRecommendation = res.aiRecommendation;
        this.aiLoading = false;
      },
      error: () => {
        this.aiLoading = false;
        alert('Failed to generate summary. Verify Gemini key.');
      }
    });
  }

  downloadPdfReport() {
    this.proposalService.downloadPdf({
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.search,
      status: this.filterStatus
    }).subscribe({
      next: (blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'proposals_report.pdf';
        link.click();
      },
      error: (err) => console.error('Failed to export proposals PDF:', err)
    });
  }
}
