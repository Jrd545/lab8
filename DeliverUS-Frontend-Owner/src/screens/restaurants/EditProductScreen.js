import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as yup from 'yup'
import DropDownPicker from 'react-native-dropdown-picker'
import {
  getDetail,
  update,
  getProductCategories
} from '../../api/ProductEndpoints'
import InputItem from '../../components/InputItem'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemiBold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { showMessage } from 'react-native-flash-message'
import { ErrorMessage, Formik } from 'formik'
import TextError from '../../components/TextError'
import { prepareEntityImages } from '../../api/helpers/FileUploadHelper'
import { buildInitialValues } from '../Helper'
import ImagePicker from '../../components/ImagePicker'

export default function EditProductScreen({ navigation, route }) {
  const [open, setOpen] = useState(false)
  const [productCategories, setProductCategories] = useState([])
  const [product, setProduct] = useState({})
  const [backendErrors, setBackendErrors] = useState()

  const [initialProductValues, setInitialProductValues] = useState({
    name: null,
    description: null,
    price: null,
    order: null,
    productCategoryId: null,
    availability: true,
    image: null
  })

  // Cargar datos del producto
  useEffect(() => {
    async function fetchProductDetail() {
      try {
        const fetchedProduct = await getDetail(route.params.id)
        const preparedProduct = prepareEntityImages(fetchedProduct, ['image'])
        setProduct(preparedProduct)
        const initialValues = buildInitialValues(
          preparedProduct,
          initialProductValues
        )
        setInitialProductValues(initialValues)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving product details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchProductDetail()
  }, [route])

  // Cargar categorías de productos
  useEffect(() => {
    async function fetchProductCategoriesData() {
      try {
        const fetchedCategories = await getProductCategories()
        const reshapedCategories = fetchedCategories.map(category => ({
          label: category.name,
          value: category.id
        }))
        setProductCategories(reshapedCategories)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving product categories. ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchProductCategoriesData()
  }, [])

  const updateProduct = async values => {
    setBackendErrors([])
    try {
      const updatedProduct = await update(product.id, values)
      showMessage({
        message: `Product ${updatedProduct.name} successfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('RestaurantDetailScreen', {
        id: route.params.restaurantId,
        dirty: true
      })
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  const validationSchema = yup.object().shape({
    name: yup.string().max(255, 'Name too long').required('Name is required'),
    description: yup.string().max(255, 'Description too long').nullable(),
    price: yup
      .number()
      .positive('Price must be positive')
      .required('Price is required'),
    order: yup.number().nullable().positive('Order must be positive').integer(),
    productCategoryId: yup
      .number()
      .positive()
      .integer()
      .required('Product category is required')
  })

  return (
    <Formik
      validationSchema={validationSchema}
      enableReinitialize
      initialValues={initialProductValues}
      onSubmit={updateProduct}
    >
      {({ handleSubmit, setFieldValue, values }) => (
        <ScrollView>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: '60%' }}>
              <InputItem name="name" label="Name:" />
              <InputItem name="description" label="Description:" />
              <InputItem
                name="price"
                label="Price (€):"
                keyboardType="numeric"
              />
              <InputItem
                name="order"
                label="Order/position to be rendered:"
                keyboardType="numeric"
              />

              <DropDownPicker
                open={open}
                value={values.productCategoryId}
                items={productCategories}
                setOpen={setOpen}
                onSelectItem={item => {
                  setFieldValue('productCategoryId', item.value)
                }}
                setItems={setProductCategories}
                placeholder="Select the product category"
                containerStyle={{ height: 40, marginTop: 20 }}
                style={{ backgroundColor: GlobalStyles.brandBackground }}
                dropDownStyle={{ backgroundColor: '#fafafa' }}
              />
              <ErrorMessage
                name="productCategoryId"
                render={msg => <TextError>{msg}</TextError>}
              />

              <TextSemiBold textStyle={{ marginTop: 20 }}>
                Is it available?
              </TextSemiBold>
              <Switch
                trackColor={{
                  false: GlobalStyles.brandSecondary,
                  true: GlobalStyles.brandPrimary
                }}
                thumbColor={
                  values.availability ? GlobalStyles.brandSecondary : '#f4f3f4'
                }
                value={values.availability}
                onValueChange={value => setFieldValue('availability', value)}
              />

              <ImagePicker
                label="Image:"
                image={values.image}
                defaultImage={defaultProductImage}
                onImagePicked={result => setFieldValue('image', result)}
              />

              {backendErrors &&
                backendErrors.map((error, index) => (
                  <TextError key={index}>
                    {error.param} - {error.msg}
                  </TextError>
                ))}

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? GlobalStyles.brandSuccessTap
                      : GlobalStyles.brandSuccess
                  },
                  styles.button
                ]}
              >
                <View
                  style={{ flexDirection: 'row', justifyContent: 'center' }}
                >
                  <MaterialCommunityIcons
                    name="content-save"
                    color="white"
                    size={20}
                  />
                  <TextRegular textStyle={styles.text}>
                    Update Product
                  </TextRegular>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </Formik>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    height: 40,
    padding: 10,
    width: '100%',
    marginTop: 20,
    marginBottom: 20
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginLeft: 5
  }
})
