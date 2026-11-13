import tiongbahruImg from '../assets/images/sg_hdb_tiongbahru_1794555272064.jpg';
import marinabayImg from '../assets/images/sg_condo_marinabay_1794555272235.jpg';
import orchardImg from '../assets/images/sg_coliving_orchard_1794555272790.jpg';
import clementiImg from '../assets/images/sg_condo_clementi_1794555273229.jpg';
import katongImg from '../assets/images/sg_terrace_katong_1794555274281.jpg';
import punggolImg from '../assets/images/sg_ec_punggol_1794555274294.jpg';
import type { ImageKey } from '../data/properties.ts';

export const PROPERTY_IMAGES: Record<ImageKey, string> = {
  tiongbahru: tiongbahruImg,
  marinabay: marinabayImg,
  orchard: orchardImg,
  clementi: clementiImg,
  katong: katongImg,
  punggol: punggolImg,
};
