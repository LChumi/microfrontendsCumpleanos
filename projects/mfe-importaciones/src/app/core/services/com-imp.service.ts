import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ComImpV1} from '../dto/com-imp-v1';

@Injectable({
  providedIn: 'root'
})
export class ComImpService {

  private readonly url = `${environment.apiUrl}/assist`;
  private http = inject(HttpClient)

  getImportacionPen(empresa : number): Observable<ComImpV1[]>{
    return this.http.get<ComImpV1[]>(`${this.url}/compimp/${empresa}`)
  }
}
