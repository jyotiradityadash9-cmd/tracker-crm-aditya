import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private apiUrl = `${API_BASE_URL}/proposals`;

  constructor(private http: HttpClient) {}

  getProposals(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    status?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });
    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getProposal(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createProposal(proposal: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, proposal);
  }

  updateProposal(id: number, proposal: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, proposal);
  }

  submitProposal(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, {});
  }

  approveProposal(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectProposal(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reject`, {});
  }

  generateAiSummary(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/generate-ai-summary`, {});
  }

  // PDF export
  downloadPdf(params: {
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    status?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });
    httpParams = httpParams.set('downloadPdf', 'true');
    return this.http.get(`${this.apiUrl}`, {
      params: httpParams,
      responseType: 'blob'
    });
  }
}
