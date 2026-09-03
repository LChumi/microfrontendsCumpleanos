import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {StockOptimo} from '../models/stock-optimo';
import {Observable} from 'rxjs';
import {MinMaxUpdateDto} from '../dto/min-max-update.dto';
import {ServiceResponse} from '../dto/service-response';

@Injectable({
  providedIn: 'root'
})
export class StockOptimoService {

  private readonly url = `${environment.apiUrl}/pedidos`
  private readonly http = inject(HttpClient)

  crearMinMax(model: StockOptimo):Observable<StockOptimo>{
    return this.http.post<StockOptimo>(`${this.url}/stockoptimo/crear`, model)
  }

  updateMinMax(request: MinMaxUpdateDto):Observable<ServiceResponse>{
    return this.http.put<ServiceResponse>(`${this.url}/stockoptimo/update`, request)
  }
}
