import type { Product } from '@features/products/types'
import { Box, Container, Grid, Typography } from '@mui/material'
import { mockProductService } from '@services/api/products/mockProductService'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import PromotionalBanners from './PromotionalBanners'

import { useRef } from 'react'
import axios from 'axios'

const DirectUpload = () => {

  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    const bearerToken =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYzNTgzOTg0LCJpYXQiOjE3NjE3ODM5ODQsImp0aSI6IjViYWZiZTEzYjBmMTRiN2Y4Nzk0YzdiMWIzMzk3MGViIiwidXNlcl9pZCI6ImUxNDVmOWJiLThlNTYtNDYyNC1iYTNhLTFjOGUwNmRmZmFlZiJ9.NCrYw9F5KFXHGgkFchIHDIHM6EpKbeGNl9dPL0WzIlc'
    const file = fileRef?.current?.files?.[0]

    // start file upload
    const START_FILE_UPLOAD_URL = "http://127.0.0.1:8000/api/v1/storage/direct/"
    const res = await axios.post(START_FILE_UPLOAD_URL, {
      original_file_name: file?.name,
      file_type: file?.type,
    }, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    })


    // perform direct upload

    const formData = new FormData()
    const url = res.data.presigned_data.url
    const fields = res.data.presigned_data.fields

    // Add all the presigned fields to formData
    Object.keys(fields).forEach(key => {
      formData.append(key, fields[key])
    })

    // Add the file last (important for S3)
    formData.append('file', file as File)

    await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })


    // finish file upload

    const FINISH_FILE_UPLOAD_URL = `http://127.0.0.1:8000/api/v1/storage/direct/finish/`
    await axios.post(FINISH_FILE_UPLOAD_URL, {
      file_id: res.data.file.id,
    }, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    })

  }

    return <>

      <label htmlFor="">File</label>
      <input type="file" ref={fileRef} />

      <button onClick={handleUpload}>Upload</button>
    </>
}



const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { products } = await mockProductService.getProducts()
        // Get first 6 products as featured
        setFeaturedProducts(products.slice(0, 6))
      } catch (error) {
        console.error('Failed to fetch featured products:', error)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return (
    <Container maxWidth="xl" disableGutters>
      <DirectUpload />
      <Box sx={{ py: 4 }}>
        {/* Promotional Banners Section */}
        <PromotionalBanners />
      </Box>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Box sx={{ py: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
            Featured Products
          </Typography>
          <Grid container spacing={3}>
            {featuredProducts.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <ProductCard product={product} index={index} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  )
}

export default HomePage
