import Url from 'url'
import Path from 'path'

import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'

import { BackTop, Menu, Icon, Card, Breadcrumb, Button } from 'antd'

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      root: {
        items: this.init()
      },
      contents: {}
    }

    this.onLoadData()
  }
  init () {
    const repos = {
      'zetsin-github': [
        {
          repo: 'node-sdl2',
          path: '/',
          branch: ''
        },
        {
          repo: 'redis-cover',
          path: '/',
          branch: ''
        }
      ]
    }
    let items = []
    Object.keys(repos).forEach(user => {
      let userRepos = repos[user]
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
      <div className='ant-layout-aside'>
        <BackTop />
        <aside className='ant-layout-sider'>
          <div className='ant-layout-logo'>
            <a href='#'>
              <img src={logo} alt='logo' />
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
        </aside>
        <div className='ant-layout-main'>
          <div className='ant-layout-container'>
            <div className='ant-layout-content'>
              <div>
                {(() => {
                  let list = []
                  let loop = (node) => {
                    let items = node.items || []
                    items.forEach(item => {
                      if (item.type === 'dir') {
                        loop(item)
                      } else {
                        let extname = Path.extname(item.name)
                        item.img = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].indexOf(extname) >= 0
                        list.push(
                          <Card
                            loading={!item.img && !this.state.contents[item.html_url]}
                            id={item.html_url}
                            key={item.html_url}
                            className='custom-card'
                            style={{ width: '100%' }}
                            bodyStyle={{ padding: 0 }}
                            extra={(() => {
                              if (!item.img) {
                                return (
                                  <Button.Group>
                                    <Button
                                      type='ghost'
                                      size='small'
                                      icon='reload'
                                      onClick={e => {
                                        this.onLoadContent(item)
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
                              }
                            })()}
                            title={
                              <Breadcrumb>
                                {(() => {
                                  let list = []

                                  let urlobj = Url.parse(item.html_url)
                                  let host = urlobj.protocol + '//' + urlobj.host + '/'
                                  let pathnodes = urlobj.pathname.replace(/^\/+|\/+$/g, '').split('/')

                                  list.push({
                                    type: 'user',
                                    name: pathnodes[0],
                                    html_url: host + pathnodes[0]
                                  })
                                  list.push({
                                    type: 'book',
                                    name: pathnodes[1],
                                    html_url: host + pathnodes[0] + '/' + pathnodes[1]
                                  })

                                  host = item.html_url.slice(0, item.html_url.lastIndexOf(item.path))
                                  pathnodes = item.path.split('/')

                                  pathnodes.forEach((pathnode, index) => {
                                    list.push({
                                      type: index < pathnodes.length - 1 ? 'folder' : 'file',
                                      name: pathnode,
                                      html_url: item.html_url.slice(0, item.html_url.lastIndexOf(pathnodes.slice(index + 1).join('/')))
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
                              if (item.img) {
                                return (
                                  <div className='custom-image'>
                                    <img alt={item.name} width='100%' src={item.download_url} />
                                  </div>
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
                  return list
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App
