# Splay（文艺平衡树）

n>=0，a 为 `vector<int>`，为空表示 n 个零，否则至少 n 项；长度固定。 真实元素位置 1..n，reverse 使用闭区间 [l,r]；输出 vector 下标从 0 起。 内部有两个守卫；旧 kth 返回含守卫的节点编号，valueAt 直接返回真实值。

每组新数据用 init(n,a) 重建；getSeq 需 O(n)，单点读取均摊 O(log n)。

均摊 O(log n)；空间 O(n)。

```cpp
struct Splay {
    struct Node {
        int ch[2] = {0, 0};
        int fa = 0;
        int sz = 1;
        bool rev = false;
        int val = 0;
    };

    int n;
    int root = 0;
    int tot = 0;
    std::vector<Node> tr;

    // 创建空对象；使用前调用 init
    Splay() {}
    // 用数组 a 建 n_ 个元素的序列树；a 为空表示全零
    Splay(int n_, const std::vector<int> &init_ = {}) {
        init(n_, init_);
    }

    // 重建序列树并丢弃旧状态；a 为空表示全零
    void init(int n_, const std::vector<int> &init_) {
        n = n_;
        tr.assign(n + 3, Node());
        tr[0].sz = 0; // 空哨兵：sz 必须为 0，否则 pushup 被默认 sz=1 污染
        tot = 0;
        root = build(1, n + 2, 0, init_);
    }

    // 新建一个值为 val、父节点为 fa 的节点，返回编号
    int newNode(int val, int fa) {
        tr[++tot] = Node();
        tr[tot].val = val;
        tr[tot].fa = fa;
        return tot;
    }

    int build(int l, int r, int fa,
              const std::vector<int> &init_) { // 建树：节点编号=创建序，键=中序位置
        if (l > r) {
            return 0;
        }
        int mid = (l + r) / 2;
        int u = newNode(0, fa);
        if (mid >= 2 && mid <= n + 1) { // 位置 1 与 n+2 是守卫，不存值
            tr[u].val = init_.empty() ? 0 : init_[mid - 2];
        }
        tr[u].ch[0] = build(l, mid - 1, u, init_);
        tr[u].ch[1] = build(mid + 1, r, u, init_);
        pushup(u);
        return u;
    }

    // 重算节点 u 的子树大小
    void pushup(int u) {
        tr[u].sz = 1 + tr[tr[u].ch[0]].sz + tr[tr[u].ch[1]].sz;
    }

    // 下传节点 u 的翻转标记
    void pushdown(int u) {
        if (tr[u].rev) {
            std::swap(tr[u].ch[0], tr[u].ch[1]);
            if (tr[u].ch[0]) {
                tr[tr[u].ch[0]].rev ^= 1;
            }
            if (tr[u].ch[1]) {
                tr[tr[u].ch[1]].rev ^= 1;
            }
            tr[u].rev = false;
        }
    }

    // 将节点 x 上旋一层
    void rotate(int x) {
        int y = tr[x].fa, z = tr[y].fa;
        int k = (tr[y].ch[1] == x);
        tr[y].ch[k] = tr[x].ch[k ^ 1];
        if (tr[x].ch[k ^ 1]) {
            tr[tr[x].ch[k ^ 1]].fa = y;
        }
        tr[x].ch[k ^ 1] = y;
        tr[y].fa = x;
        tr[x].fa = z;
        if (z) {
            tr[z].ch[tr[z].ch[1] == y] = x;
        }
        pushup(y);
        pushup(x);
    }

    // 把节点 x 旋转到 goal 之下（goal=0 表示根）
    void splay(int x, int goal) {
        static std::vector<int> st;
        st.clear();
        for (int u = x; u != goal; u = tr[u].fa) {
            st.push_back(u);
        }
        while (!st.empty()) { // 自顶向下下传 rev，防止旋转破坏懒标记
            pushdown(st.back());
            st.pop_back();
        }
        while (tr[x].fa != goal) {
            int y = tr[x].fa, z = tr[y].fa;
            if (z != goal) {
                if ((tr[y].ch[0] == x) ^ (tr[z].ch[0] == y)) {
                    rotate(x);
                } else {
                    rotate(y);
                }
            }
            rotate(x);
        }
        if (goal == 0) {
            root = x;
        }
    }

    // 返回中序第 k 个节点（1-based，含守卫）
    int kth(int k) { // 返回第 k 个节点（1-based），不旋转
        int u = root;
        while (true) {
            pushdown(u);
            int ls = tr[tr[u].ch[0]].sz;
            if (k <= ls) {
                u = tr[u].ch[0];
            } else if (k == ls + 1) {
                return u;
            } else {
                k -= ls + 1;
                u = tr[u].ch[1];
            }
        }
    }

    // 返回真实位置 k 的值；1<=k<=n，伸展该节点以保证均摊复杂度。
    int valueAt(int k) {
        assert(1 <= k && k <= n);
        int node = kth(k + 1);
        splay(node, 0);
        return tr[node].val;
    }

    // 翻转真实元素的 1-based 闭区间 [l,r]
    void reverse(int l, int r) { // 翻转 [l, r]（1-based 含端点）；守卫在位置 1 与 n+2
        int L = kth(l);          // 左守卫（元素 l 的前一个位置）
        splay(L, 0);
        int R = kth(r + 2); // 右守卫（元素 r 的后一个位置）
        splay(R, L);
        int mid = tr[R].ch[0];
        if (mid) {
            tr[mid].rev ^= 1;
        }
    }

    // 返回当前真实序列（去掉两个守卫），0-based
    std::vector<int> getSeq() {
        std::vector<int> res, pending;
        int vertex = root, position = 0;
        while (vertex || !pending.empty()) {
            while (vertex) {
                pushdown(vertex);
                pending.push_back(vertex);
                vertex = tr[vertex].ch[0];
            }
            vertex = pending.back();
            pending.pop_back();
            ++position;
            if (position >= 2 && position <= n + 1)
                res.push_back(tr[vertex].val);
            vertex = tr[vertex].ch[1];
        }
        return res;
    }
};
```
