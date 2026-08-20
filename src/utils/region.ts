/**
 * 省市区三级联动数据（基于 china-division 包的三个 JSON 文件）
 * 数据来源：民政部行政区划代码，自动随包更新
 */

import provincesData from 'china-division/dist/provinces.json';
import citiesData from 'china-division/dist/cities.json';
import areasData from 'china-division/dist/areas.json';

export type CityMap = Record<string, string[]>;
export type RegionMap = Record<string, CityMap>;

// 类型断言，确保 TypeScript 识别为数组
const provinces = provincesData as any[];
const cities = citiesData as any[];
const areas = areasData as any[];

// 构建省 -> 省名的映射
const provinceMap: Record<string, string> = {};
for (const p of provinces) {
  provinceMap[p.code] = p.name;
}

// 构建市 code -> 市名的映射，以及市 code -> 所属省 code
const cityMap: Record<string, { name: string; provinceCode: string }> = {};
for (const c of cities) {
  cityMap[c.code] = { name: c.name, provinceCode: c.provinceCode };
}

// 构建区列表，按市 code 分组
const areaMap: Record<string, string[]> = {};
for (const a of areas) {
  if (!areaMap[a.cityCode]) {
    areaMap[a.cityCode] = [];
  }
  areaMap[a.cityCode].push(a.name);
}

// 最终构建 fullRegionData: 省名 -> { 市名 -> 区名[] }
function buildRegionData(): RegionMap {
  const result: RegionMap = {};

  // 遍历每个省
  for (const p of provinces) {
    const provinceName = p.name;
    const citiesInProvince: CityMap = {};

    // 找出该省下的所有市
    const cityCodes = Object.keys(cityMap).filter(
      (code) => cityMap[code].provinceCode === p.code
    );

    for (const cityCode of cityCodes) {
      const cityName = cityMap[cityCode].name;
      const districtList = areaMap[cityCode] || ['其他'];
      citiesInProvince[cityName] = districtList;
    }

    // 如果该省没有市（极少情况，如港澳台可能没有下级），则添加一个占位
    if (Object.keys(citiesInProvince).length === 0) {
      citiesInProvince['其他'] = ['其他'];
    }

    result[provinceName] = citiesInProvince;
  }

  return result;
}

export const fullRegionData = buildRegionData();

// 兼容旧接口
export const regionData = fullRegionData;

/** 省级名称列表（按数据顺序） */
export const provinceList: string[] = Object.keys(fullRegionData);

/** 获取某省下辖的市列表（按数据顺序） */
export function cityListOf(province: string): string[] {
  if (!province) return [];
  return Object.keys(fullRegionData[province] || {});
}

/** 获取某省某市下辖的区/县列表（按数据顺序） */
export function districtListOf(province: string, city: string): string[] {
  if (!province || !city) return [];
  return fullRegionData[province]?.[city] || [];
}