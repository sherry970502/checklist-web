import React, { useState } from 'react';
import { Layout, Menu, Button, List, Typography, Modal, Input, message, Tabs, Checkbox, Select, Tree, Dropdown } from 'antd';
import {
  PlusOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
} from '@ant-design/icons';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// 递归生成唯一id
let globalId = 1000;
const genId = () => ++globalId;

// 初始模版（多层级结构）
const initialTemplates = [
  {
    id: 1,
    name: '写论文模版',
    tree: [
      {
        id: 11,
        title: '准备资料',
        children: [
          { id: 12, title: '查找文献' },
          { id: 13, title: '整理大纲' },
        ],
      },
      {
        id: 14,
        title: '撰写初稿',
        children: [
          { id: 15, title: '写引言' },
          { id: 16, title: '写方法' },
        ],
      },
    ],
  },
  {
    id: 2,
    name: '做项目模版',
    tree: [
      {
        id: 21,
        title: '需求分析',
        children: [
          { id: 22, title: '调研' },
          { id: 23, title: '需求文档' },
        ],
      },
    ],
  },
];

// 初始实例
const initialInstances = [
  // { id: 1, name: 'A项目', templateId: 2, flows: [{...}], checked: {flowId: [itemIdx]} }
];

// 假账号数据
const USERS = [
  { username: 'user01', password: 'pass01' },
  { username: 'user02', password: 'pass02' },
  { username: 'user03', password: 'pass03' },
  { username: 'user04', password: 'pass04' },
  { username: 'user05', password: 'pass05' },
  { username: 'user06', password: 'pass06' },
  { username: 'user07', password: 'pass07' },
  { username: 'user08', password: 'pass08' },
  { username: 'user09', password: 'pass09' },
  { username: 'user10', password: 'pass10' },
  { username: 'user11', password: 'pass11' },
  { username: 'user12', password: 'pass12' },
  { username: 'user13', password: 'pass13' },
  { username: 'user14', password: 'pass14' },
  { username: 'user15', password: 'pass15' },
  { username: 'user16', password: 'pass16' },
  { username: 'user17', password: 'pass17' },
  { username: 'user18', password: 'pass18' },
  { username: 'user19', password: 'pass19' },
  { username: 'user20', password: 'pass20' },
];

function App() {
  // 模式切换
  const [tabKey, setTabKey] = useState('template');

  // 模版管理
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || null);

  // 编辑模版相关
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [flowTitle, setFlowTitle] = useState('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemText, setItemText] = useState('');
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [parentFlowId, setParentFlowId] = useState(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // 事务实例
  const [instances, setInstances] = useState(initialInstances);
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [instanceTemplateId, setInstanceTemplateId] = useState(null);

  // checklist勾选状态（实例专用）
  const [checkedMap, setCheckedMap] = useState({}); // {instanceId: {flowId: [itemIdx]}}

  // checklist树编辑相关
  const [treeModal, setTreeModal] = useState({ open: false, type: 'add', title: '', node: null, parentKey: null });

  // 备注弹窗状态
  const [remarkModal, setRemarkModal] = useState({ open: false, value: '', nodeId: null });

  // 登录态
  const [user, setUser] = useState(null);
  // 登录表单
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // ========== 模版管理相关 ========== //
  const currentTemplate = templates.find(t => t.id === selectedTemplateId);

  // 新建模版
  const handleAddTemplate = () => {
    setIsTemplateModalOpen(true);
    setTemplateName('');
    setEditingTemplateId(null);
  };
  // 编辑模版
  const handleEditTemplate = (tpl) => {
    setIsTemplateModalOpen(true);
    setTemplateName(tpl.name);
    setEditingTemplateId(tpl.id);
  };
  // 删除模版
  const handleDeleteTemplate = (tplId) => {
    Modal.confirm({
      title: '确定要删除该模版吗？',
      onOk: () => {
        setTemplates(templates.filter(t => t.id !== tplId));
        if (selectedTemplateId === tplId) setSelectedTemplateId(templates[0]?.id || null);
      },
    });
  };
  // 保存模版
  const handleTemplateModalOk = () => {
    if (!templateName.trim()) {
      message.error('模版名称不能为空');
      return;
    }
    if (editingTemplateId) {
      setTemplates(templates.map(t => t.id === editingTemplateId ? { ...t, name: templateName } : t));
    } else {
      const newId = genId();
      setTemplates([...templates, { id: newId, name: templateName, tree: [], owner: user.username }]);
      setSelectedTemplateId(newId);
    }
    setIsTemplateModalOpen(false);
    setTemplateName('');
    setEditingTemplateId(null);
  };

  // 递归查找并操作树节点
  function updateTree(tree, key, cb) {
    return tree.map(node => {
      if (node.id === key) {
        return cb(node);
      } else if (node.children) {
        return { ...node, children: updateTree(node.children, key, cb) };
      } else {
        return node;
      }
    });
  }
  // 递归删除树节点
  function deleteTreeNode(tree, key) {
    return tree.filter(node => {
      if (node.id === key) return false;
      if (node.children) node.children = deleteTreeNode(node.children, key);
      return true;
    });
  }

  // 新增节点
  const handleAddNode = (parentKey = null) => {
    setTreeModal({ open: true, type: 'add', title: '', node: null, parentKey });
  };
  // 编辑节点
  const handleEditNode = (node) => {
    setTreeModal({ open: true, type: 'edit', title: node.title, node, parentKey: null });
  };
  // 删除节点
  const handleDeleteNode = (key) => {
    Modal.confirm({
      title: '确定要删除该节点及其所有子节点吗？',
      onOk: () => {
        setTemplates(templates.map(t =>
          t.id === selectedTemplateId
            ? { ...t, tree: deleteTreeNode(t.tree, key) }
            : t
        ));
      },
    });
  };
  // 节点Modal确认
  const handleTreeModalOk = () => {
    if (!treeModal.title.trim()) {
      message.error('名称不能为空');
      return;
    }
    if (treeModal.type === 'add') {
      const newNode = { id: genId(), title: treeModal.title };
      setTemplates(templates.map(t => {
        if (t.id !== selectedTemplateId) return t;
        if (!treeModal.parentKey) {
          return { ...t, tree: [...t.tree, newNode] };
        } else {
          return {
            ...t,
            tree: updateTree(t.tree, treeModal.parentKey, node => ({
              ...node,
              children: node.children ? [...node.children, newNode] : [newNode],
            })),
          };
        }
      }));
    } else if (treeModal.type === 'edit') {
      setTemplates(templates.map(t => {
        if (t.id !== selectedTemplateId) return t;
        return {
          ...t,
          tree: updateTree(t.tree, treeModal.node.id, node => ({ ...node, title: treeModal.title })),
        };
      }));
    }
    setTreeModal({ open: false, type: 'add', title: '', node: null, parentKey: null });
  };

  // 递归渲染树节点的操作菜单
  const renderTitle = (node, level = 1) => {
    return (
      <span>
        {node.title}
        <Dropdown
          menu={{
            items: [
              { key: 'add', label: '新增子节点', disabled: level >= 10, onClick: () => handleAddNode(node.id) },
              { key: 'edit', label: '编辑', onClick: () => handleEditNode(node) },
              { key: 'delete', label: '删除', danger: true, onClick: () => handleDeleteNode(node.id) },
            ],
          }}
          trigger={['click']}
        >
          <Button size="small" icon={<DownOutlined />} style={{ marginLeft: 8 }} />
        </Dropdown>
      </span>
    );
  };

  // 递归生成Tree数据
  function buildTreeData(nodes, level = 1) {
    return nodes.map(node => ({
      key: node.id,
      title: renderTitle(node, level),
      children: node.children ? buildTreeData(node.children, level + 1) : undefined,
    }));
  }

  // 新建流程（模版）
  const handleAddFlow = () => {
    setIsFlowModalOpen(true);
    setFlowTitle('');
  };
  // 流程Modal确认（模版）
  const handleFlowModalOk = () => {
    if (!flowTitle.trim()) {
      message.error('流程名称不能为空');
      return;
    }
    setIsFlowModalOpen(false);
    setFlowTitle('');
  };

  // ========== 事务实例相关 ========== //
  const currentInstance = instances.find(i => i.id === selectedInstanceId);
  const currentInstanceTemplate = templates.find(t => t.id === currentInstance?.templateId);

  // 新建实例
  const handleAddInstance = () => {
    setIsInstanceModalOpen(true);
    setInstanceName('');
    setInstanceTemplateId(null);
  };
  // 保存实例
  const handleInstanceModalOk = () => {
    if (!instanceName.trim()) {
      message.error('实例名称不能为空');
      return;
    }
    if (!instanceTemplateId) {
      message.error('请选择一个模版');
      return;
    }
    const tpl = templates.find(t => t.id === instanceTemplateId);
    if (!tpl) {
      message.error('模版不存在');
      return;
    }
    const newId = genId();
    setInstances([
      ...instances,
      {
        id: newId,
        name: instanceName,
        templateId: tpl.id,
        tree: JSON.parse(JSON.stringify(tpl.tree)),
        owner: user.username,
      },
    ]);
    setSelectedInstanceId(newId);
    setIsInstanceModalOpen(false);
    setInstanceName('');
    setInstanceTemplateId(null);
  };
  // 删除实例
  const handleDeleteInstance = (id) => {
    Modal.confirm({
      title: '确定要删除该实例吗？',
      onOk: () => {
        setInstances(instances.filter(i => i.id !== id));
        if (selectedInstanceId === id) setSelectedInstanceId(null);
      },
    });
  };
  // 递归更新实例树节点的remark
  function updateInstanceRemark(tree, nodeId, value) {
    return tree.map(node => {
      if (node.id === nodeId) {
        return { ...node, remark: value };
      } else if (node.children) {
        return { ...node, children: updateInstanceRemark(node.children, nodeId, value) };
      } else {
        return node;
      }
    });
  }
  // 递归渲染实例树节点，支持勾选和备注
  const renderInstanceTree = (nodes, instanceId, checkedMap, handleCheck, handleRemark, level = 1) => {
    if (!nodes) return null;
    return (
      <ul style={{ marginLeft: level > 1 ? 20 : 0, paddingLeft: 0 }}>
        {nodes.map((node, idx) => (
          <li key={node.id} style={{ marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={checkedMap[instanceId]?.[node.id] || false}
                onChange={e => handleCheck(instanceId, node.id, e.target.checked)}
                style={{ marginRight: 8 }}
              />
              {node.title}
              <Button
                size="small"
                icon={<EditOutlined />}
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={() => handleRemark(node)}
              >备注</Button>
            </span>
            {node.remark && (
              <div style={{ color: '#888', fontSize: 12, marginLeft: 24, marginTop: 2 }}>{node.remark}</div>
            )}
            {node.children && node.children.length > 0 &&
              renderInstanceTree(node.children, instanceId, checkedMap, handleCheck, handleRemark, level + 1)
            }
          </li>
        ))}
      </ul>
    );
  };
  // checklist勾选（多层级）
  const handleCheck = (instanceId, nodeId, checked) => {
    setCheckedMap(prev => {
      const prevChecked = prev[instanceId] || {};
      return {
        ...prev,
        [instanceId]: {
          ...prevChecked,
          [nodeId]: checked,
        },
      };
    });
  };
  // 备注按钮回调
  const handleRemark = (node) => {
    setRemarkModal({ open: true, value: node.remark || '', nodeId: node.id });
  };
  // 备注弹窗确认
  const handleRemarkOk = () => {
    setInstances(instances.map(ins => {
      if (ins.id !== selectedInstanceId) return ins;
      return {
        ...ins,
        tree: updateInstanceRemark(ins.tree, remarkModal.nodeId, remarkModal.value),
      };
    }));
    setRemarkModal({ open: false, value: '', nodeId: null });
  };

  // 登录处理
  const handleLogin = () => {
    const found = USERS.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (found) {
      setUser({ username: found.username });
      setLoginError('');
    } else {
      setLoginError('账号或密码错误');
    }
  };
  // 退出登录
  const handleLogout = () => {
    setUser(null);
  };

  // 登录页
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
        <div style={{ width: 340, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2', padding: 32 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Checklist + AI 工具 登录</h2>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="账号"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
              onPressEnter={handleLogin}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Input.Password
              placeholder="密码"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              onPressEnter={handleLogin}
            />
          </div>
          {loginError && <div style={{ color: 'red', marginBottom: 12 }}>{loginError}</div>}
          <Button type="primary" block onClick={handleLogin}>登录</Button>
          <div style={{ color: '#888', fontSize: 12, marginTop: 16 }}>
            账号：user01 ~ user20<br />密码：pass01 ~ pass20
          </div>
        </div>
      </div>
    );
  }

  // 只显示属于当前账号的数据（模版、实例）
  const userTemplates = templates.filter(t => t.owner === user.username || !t.owner);
  const userInstances = instances.filter(i => i.owner === user.username || !i.owner);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: '#fff', fontSize: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><CheckSquareOutlined style={{ marginRight: 10 }} />Checklist + AI 工具</span>
        <span>
          <span style={{ marginRight: 16 }}>当前账号：{user.username}</span>
          <Button onClick={handleLogout}>退出登录</Button>
        </span>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff' }}>
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            tabBarStyle={{ marginBottom: 0 }}
            style={{ height: '100%' }}
          >
            <TabPane tab="模版管理" key="template">
              <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <Button type="primary" icon={<PlusOutlined />} block onClick={handleAddTemplate}>
                  新建模版
                </Button>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[String(selectedTemplateId)]}
                style={{ height: 320, borderRight: 0 }}
                onClick={({ key }) => setSelectedTemplateId(Number(key))}
              >
                {userTemplates.map((tpl) => (
                  <Menu.Item key={tpl.id}>
                    {tpl.name}
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      style={{ marginLeft: 8 }}
                      onClick={e => { e.stopPropagation(); handleEditTemplate(tpl); }}
                    />
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      style={{ marginLeft: 4 }}
                      onClick={e => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }}
                    />
                  </Menu.Item>
                ))}
              </Menu>
            </TabPane>
            <TabPane tab="事务实例" key="instance">
              <div style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <Button type="primary" icon={<PlusOutlined />} block onClick={handleAddInstance}>
                  新建实例
                </Button>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[String(selectedInstanceId)]}
                style={{ height: 320, borderRight: 0 }}
                onClick={({ key }) => setSelectedInstanceId(Number(key))}
              >
                {userInstances.map((ins) => (
                  <Menu.Item key={ins.id}>
                    {ins.name}
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      style={{ marginLeft: 8 }}
                      onClick={e => { e.stopPropagation(); handleDeleteInstance(ins.id); }}
                    />
                  </Menu.Item>
                ))}
              </Menu>
            </TabPane>
          </Tabs>
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', minHeight: 280 }}>
            {/* 模版管理区 */}
            {tabKey === 'template' && currentTemplate && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={3}>{currentTemplate.name}</Title>
                  <Button icon={<RobotOutlined />}>AI生成checklist</Button>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleAddNode(null)}>
                    新增一级节点
                  </Button>
                </div>
                <Tree
                  treeData={buildTreeData(currentTemplate.tree)}
                  defaultExpandAll
                  showLine
                />
              </>
            )}
            {/* 事务实例区 */}
            {tabKey === 'instance' && currentInstance && currentInstanceTemplate && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={3}>{currentInstance.name}</Title>
                  <span style={{ color: '#888' }}>模版：{currentInstanceTemplate.name}</span>
                </div>
                <div style={{ marginTop: 16 }}>
                  {renderInstanceTree(currentInstance.tree, currentInstance.id, checkedMap, handleCheck, handleRemark)}
                </div>
                <Modal
                  title="编辑备注"
                  open={remarkModal.open}
                  onOk={handleRemarkOk}
                  onCancel={() => setRemarkModal({ open: false, value: '', nodeId: null })}
                  okText="确定"
                  cancelText="取消"
                >
                  <Input.TextArea
                    placeholder="请输入备注内容"
                    value={remarkModal.value}
                    onChange={e => setRemarkModal({ ...remarkModal, value: e.target.value })}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </Modal>
              </>
            )}
            {/* 节点Modal */}
            <Modal
              title={treeModal.type === 'add' ? '新增节点' : '编辑节点'}
              open={treeModal.open}
              onOk={handleTreeModalOk}
              onCancel={() => setTreeModal({ open: false, type: 'add', title: '', node: null, parentKey: null })}
              okText="确定"
              cancelText="取消"
            >
              <Input
                placeholder="请输入名称"
                value={treeModal.title}
                onChange={e => setTreeModal({ ...treeModal, title: e.target.value })}
                onPressEnter={handleTreeModalOk}
              />
            </Modal>
            {/* 模版Modal */}
            <Modal
              title={editingTemplateId ? '编辑模版' : '新建模版'}
              open={isTemplateModalOpen}
              onOk={handleTemplateModalOk}
              onCancel={() => setIsTemplateModalOpen(false)}
              okText="确定"
              cancelText="取消"
            >
              <Input
                placeholder="请输入模版名称"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                onPressEnter={handleTemplateModalOk}
              />
            </Modal>
            {/* 流程Modal */}
            <Modal
              title="新增流程"
              open={isFlowModalOpen}
              onOk={handleFlowModalOk}
              onCancel={() => setIsFlowModalOpen(false)}
              okText="确定"
              cancelText="取消"
            >
              <Input
                placeholder="请输入流程名称"
                value={flowTitle}
                onChange={(e) => setFlowTitle(e.target.value)}
                onPressEnter={handleFlowModalOk}
              />
            </Modal>
            {/* checklist项Modal */}
            <Modal
              title="新增checklist项"
              open={isItemModalOpen}
              onOk={() => {
                if (!itemText.trim()) {
                  message.error('内容不能为空');
                  return;
                }
                setTemplates(templates.map(t => {
                  if (t.id !== selectedTemplateId) return t;
                  return {
                    ...t,
                    tree: t.tree.map(f => {
                      if (f.id !== parentFlowId) return f;
                      return { ...f, items: [...f.items, itemText] };
                    }),
                  };
                }));
                setIsItemModalOpen(false);
                setItemText('');
                setEditingItemIdx(null);
                setParentFlowId(null);
              }}
              onCancel={() => setIsItemModalOpen(false)}
              okText="确定"
              cancelText="取消"
            >
              <Input
                placeholder="请输入内容"
                value={itemText}
                onChange={(e) => setItemText(e.target.value)}
                onPressEnter={() => {
                  if (!itemText.trim()) {
                    message.error('内容不能为空');
                    return;
                  }
                  setTemplates(templates.map(t => {
                    if (t.id !== selectedTemplateId) return t;
                    return {
                      ...t,
                      tree: t.tree.map(f => {
                        if (f.id !== parentFlowId) return f;
                        return { ...f, items: [...f.items, itemText] };
                      }),
                    };
                  }));
                  setIsItemModalOpen(false);
                  setItemText('');
                  setEditingItemIdx(null);
                  setParentFlowId(null);
                }}
              />
            </Modal>
            {/* 新建实例Modal */}
            <Modal
              title="新建事务实例"
              open={isInstanceModalOpen}
              onOk={handleInstanceModalOk}
              onCancel={() => setIsInstanceModalOpen(false)}
              okText="确定"
              cancelText="取消"
            >
              <Input
                placeholder="请输入实例名称"
                value={instanceName}
                onChange={e => setInstanceName(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <Select
                placeholder="请选择一个模版"
                value={instanceTemplateId}
                onChange={setInstanceTemplateId}
                style={{ width: '100%' }}
              >
                {templates.map(tpl => (
                  <Option value={tpl.id} key={tpl.id}>{tpl.name}</Option>
                ))}
              </Select>
            </Modal>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
