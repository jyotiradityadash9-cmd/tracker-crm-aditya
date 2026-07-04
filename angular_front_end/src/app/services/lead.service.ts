import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private apiUrl = 'http://localhost:3000/api/leads';

  constructor(private http: HttpClient) {}

  getLeads(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    status?: string;
    source?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });
    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getLead(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createLead(lead: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, lead);
  }

  updateLead(id: number, lead: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, lead);
  }

  deleteLead(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Follow-ups
  getFollowUps(leadId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${leadId}/followups`);
  }

  createFollowUp(leadId: number, followUp: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${leadId}/followups`, followUp);
  }

  updateFollowUp(id: number, followUp: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/followups/${id}`, followUp);
  }

  deleteFollowUp(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/followups/${id}`);
  }

  // PDF export
  downloadPdf(params: {
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    status?: string;
    source?: string;
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
