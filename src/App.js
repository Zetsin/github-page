import Url from 'url'
import Path from 'path'

import Exif from 'exif-js'

import Repos from './Repos'

import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'

import { Menu, Icon, Card, Breadcrumb, Button, Row, Col } from 'antd'

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      root: {
        items: this.init()
      },
      contents: {},
      images: {}
    }

    this.onLoadData()
  }
  init () {
    let items = []
    Object.keys(Repos).forEach(user => {
      let userRepos = Repos[user]
      userRepos.forEach(({
        repo,
        path = '/',
        branch
      } = {}) => {
        if (path[0] !== '/') {
          path = '/' + path
        }
        branch = branch || 'master'
        items.push({
          type: 'dir',
          name: user + '/' + repo + path,
          html_url: 'https://github.com/' + user + '/' + repo + '/tree/' + branch + path,
          url: 'https://api.github.com/repos/' + user + '/' + repo + '/contents' + path + '?ref=' + branch
        })
      })
    })

    return items
  }
  onLoadContent (node) {
    setTimeout(() => {
      window
      .fetch(node.download_url)
      .then(res => {
        return res.text()
      })
      .then(text => {
        this.setState({
          contents: Object.assign(this.state.contents, {
            [node.html_url]: text
          })
        })
      })
      .catch(err => {
        console.log(err)
      })
    })
  }
  onLoadData (key = '') {
    let fetching = node => {
      if (node.fetched) {
        return
      }
      node.fetched = true
      window
      .fetch(node.url)
      .then(res => {
        return res.json()
      })
      .then(data => {
        node.items = []
        data.forEach(item => {
          node.items.push(item)

          if (!item.download_url) {
            return
          }

          let isImage = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].indexOf(Path.extname(item.name)) >= 0
          if (isImage) {
            return
          }

          this.onLoadContent(item)
        })
        this.setState({
          root: this.state.root
        })
      })
      .catch(err => {
        node.fetched = false
        console.log(err)
      })
    }
    let loop = node => {
      for (let index = 0; index < node.items.length; index++) {
        let item = node.items[index]

        if (!key) {
          fetching(item)
        } else if (key.indexOf(item.html_url) === 0) {
          if (key === item.html_url) {
            fetching(item)
          } else {
            loop(item)
          }
          break
        }
      }
    }
    loop(this.state.root)
  }
  render () {
    return (
      <div style={{
        position: 'fixed',
        height: '100%',
        width: '100%',
        display: 'flex'
      }}>
        <div style={{
          flex: 1,
          overflow: 'scroll',
          background: '#404040'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <a href='#'>
              <img src={logo} alt='logo' className='App-logo' />
            </a>
          </div>
          <Menu
            mode='inline'
            theme='dark'
            defaultOpenKeys={this.state.root.items.map(item => item.html_url)}>
            {(() => {
              let loop = (node) => {
                let items = node.items || []
                return items.map((item) => {
                  if (item.type === 'dir') {
                    return (
                      <Menu.SubMenu
                        key={item.html_url}
                        title={<span><Icon type='folder' />{item.name}</span>}
                        onTitleClick={e => {
                          this.onLoadData(e.key)
                        }}>
                        {loop(item)}
                      </Menu.SubMenu>
                    )
                  } else {
                    return (
                      <Menu.Item
                        key={item.html_url}>
                        <a href={'/#' + item.html_url}>
                          <span><Icon type='file' />{item.name}</span>
                        </a>
                      </Menu.Item>
                    )
                  }
                })
              }
              return loop(this.state.root)
            })()}
          </Menu>
        </div>
        <div style={{
          flex: 4,
          overflow: 'scroll',
          padding: 24
        }}>
          {(() => {
            let list = []
            let loop = (node) => {
              let items = node.items || []
              items.forEach(item => {
                if (item.type === 'dir') {
                  loop(item)
                } else {
                  let isImage = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].indexOf(Path.extname(item.name)) >= 0
                  list.push(
                    <Card
                      id={item.html_url}
                      loading={!isImage && !this.state.contents[item.html_url]}
                      key={item.html_url}
                      className='custom-card'
                      style={{ width: '100%' }}
                      bodyStyle={{ padding: 0 }}
                      extra={(() => {
                        return (
                          <Button.Group>
                            <Button
                              type='ghost'
                              size='small'
                              icon='reload'
                              onClick={e => {
                                if (isImage) {
                                  let image = document.getElementById(new Buffer(item.html_url).toString('base64'))
                                  if (image) {
                                    let src = image.src
                                    image.src = ''
                                    image.src = src
                                  }
                                } else {
                                  this.onLoadContent(item)
                                }
                              }}>
                              {(() => {
                                if (item.size === 0) return '0 B'
                                let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                                let k = 1000
                                let i = Math.floor(Math.log(item.size) / Math.log(k))
                                return (item.size / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i]
                              })()}
                            </Button>
                          </Button.Group>
                        )
                      })()}
                      title={
                        <Breadcrumb>
                          {(() => {
                            let list = []

                            let urlobj = Url.parse(item.html_url)
                            let host = urlobj.protocol + '//' + urlobj.host + '/'
                            let infos = urlobj.pathname.replace(/^\/+|\/+$/g, '').split('/')

                            let user = infos[0]
                            let userurl = host + user

                            list.push({
                              type: 'user',
                              name: user,
                              html_url: userurl
                            })

                            let repo = infos[1]
                            let repourl = userurl + '/' + repo + '/tree/' + Url.parse(item.url, true).query.ref

                            list.push({
                              type: 'book',
                              name: repo,
                              html_url: repourl
                            })

                            let pathnodes = item.path.split('/')
                            pathnodes.forEach((pathnode, index) => {
                              repourl += '/' + pathnode
                              list.push({
                                type: index === pathnodes.length - 1 ? 'file' : 'folder',
                                name: pathnode,
                                html_url: repourl
                              })
                            })

                            return list.map(pathnode => {
                              return (
                                <Breadcrumb.Item key={pathnode.html_url} href={pathnode.html_url} target='_blank'>
                                  <Icon type={pathnode.type} />
                                  <span>{pathnode.name}</span>
                                </Breadcrumb.Item>
                              )
                            })
                          })()}
                        </Breadcrumb>}>
                      {(() => {
                        if (isImage) {
                          let image = this.state.images[item.html_url] || {}
                          return (
                            <Row type='flex' justify='center' align='top'>
                              <Col span={16}>
                                <div className='custom-image'>
                                  <img
                                    id={new Buffer(item.html_url).toString('base64')}
                                    width='100%'
                                    alt={item.name}
                                    src={item.download_url}
                                    onLoad={e => {
                                      let image = e.currentTarget

                                      let setContent = (exif) => {
                                        this.setState({
                                          images: Object.assign(this.state.images, {
                                            [item.html_url]: {
                                              exif,
                                              width: image.width,
                                              height: image.height
                                            }
                                          })
                                        })
                                      }
                                      Exif.getData(image, function () {
                                        let allTags = Exif.getAllTags(this)
                                        delete allTags.MakerNote
                                        setContent(Exif.pretty(this))
                                      })
                                    }} />
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className='custom-content' style={{
                                  overflow: 'scroll',
                                  height: image.height
                                }}>
                                  <pre>{image.exif}</pre>
                                </div>
                              </Col>
                            </Row>
                          )
                        } else {
                          return (
                            <div className='custom-content'>
                              <pre>{this.state.contents[item.html_url]}</pre>
                            </div>
                          )
                        }
                      })()}
                    </Card>
                  )
                }
              })
            }

            loop(this.state.root)
            return list.reverse()
          })()}
        </div>
      </div>
    )
  }
}

export default App
